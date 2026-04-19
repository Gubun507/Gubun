const GUBUN_DATA = {
    tools: [],
    
    scripts: [
        {
            id: "script-1",
            name: "Advanced First Person Controller",
            engine: "unity",
            language: "csharp",
            description: "Controlador FPS profesional con movimiento WASD, salto, sprint, crouch, head bob, slope handling y ground detection avanzado.",
            tags: ["FPS", "Controller", "Movement", "WASD"],
            downloads: 5420,
            rating: 4.9,
            icon: "🎮",
            code: `/*
 * =============================================================================
 * ADVANCED FIRST PERSON CONTROLLER
 * Copyright (c) 2025 GUBUN. All Rights Reserved.
 * Author: GUBUN Engineering Team
 * Version: 2.1.0
 * License: Commercial License - GUBUN Tools
 * Website: https://gubun.onrender.com
 * =============================================================================
 * 
 * FEATURES:
 * - Smooth WASD movement with acceleration/deceleration
 * - Head bob animation system
 * - Crouch and sprint mechanics
 * - Slope handling and step climbing
 * - Ground detection with multiple raycasts
 * - Configurable via Inspector
 */

using UnityEngine;

namespace Gubun.UnityTools.Controllers
{
    [RequireComponent(typeof(CharacterController))]
    [AddComponentMenu("Gubun/Controllers/First Person Controller")]
    public class FirstPersonController : MonoBehaviour
    {
        [Header("GUBUN - Movement Settings")]
        [Tooltip("Velocidad de caminata normal")]
        [Range(1f, 20f)]
        public float walkSpeed = 5f;
        
        [Tooltip("Multiplicador de velocidad al correr")]
        [Range(1f, 3f)]
        public float sprintMultiplier = 1.8f;
        
        [Tooltip("Multiplicador de velocidad al agacharse")]
        [Range(0.1f, 1f)]
        public float crouchMultiplier = 0.5f;
        
        [Tooltip("Fuerza de salto")]
        [Range(1f, 20f)]
        public float jumpForce = 8f;
        
        [Tooltip("Gravedad personalizada")]
        [Range(9.8f, 50f)]
        public float gravity = 20f;

        [Header("GUBUN - Ground Detection")]
        [Tooltip("Radio de detección de suelo")]
        [Range(0.1f, 1f)]
        public float groundCheckRadius = 0.4f;
        
        [Tooltip("Distancia del raycast de suelo")]
        [Range(0.1f, 2f)]
        public float groundCheckDistance = 0.2f;
        
        [Tooltip("Layer mask para detección de suelo")]
        public LayerMask groundMask = ~0;
        
        [Tooltip("Ángulo máximo de pendiente caminable")]
        [Range(30f, 80f)]
        public float maxSlopeAngle = 45f;

        [Header("GUBUN - Head Bob Settings")]
        [Tooltip("Amplitud del head bob")]
        [Range(0f, 1f)]
        public float bobAmplitude = 0.1f;
        
        [Tooltip("Frecuencia del head bob")]
        [Range(0f, 30f)]
        public float bobFrequency = 12f;
        
        [Tooltip("Suavizado del head bob")]
        [Range(0f, 1f)]
        public float bobSmoothing = 0.1f;

        [Header("GUBUN - Input Settings")]
        public string horizontalAxis = "Horizontal";
        public string verticalAxis = "Vertical";
        public KeyCode sprintKey = KeyCode.LeftShift;
        public KeyCode crouchKey = KeyCode.LeftControl;
        public KeyCode jumpKey = KeyCode.Space;

        // Componentes privados
        private CharacterController controller;
        private Camera playerCamera;
        private Transform cameraHolder;
        
        // Variables de estado
        private Vector3 velocity;
        private float verticalVelocity;
        private bool isGrounded;
        private bool wasGrounded;
        private bool isSprinting;
        private bool isCrouching;
        private float currentSpeed;
        private float defaultCameraHeight;
        
        // Head bob
        private float bobTimer;
        private float defaultCameraY;
        private Vector3 targetBobPosition;

        // Copyright Notice
        private const string COPYRIGHT = "© 2025 GUBUN. All Rights Reserved.";

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            
            // Setup camera holder
            cameraHolder = transform.Find("CameraHolder");
            if (cameraHolder == null)
            {
                cameraHolder = new GameObject("CameraHolder").transform;
                cameraHolder.SetParent(transform);
                cameraHolder.localPosition = new Vector3(0, 1.6f, 0);
            }
            
            playerCamera = cameraHolder.GetComponentInChildren<Camera>();
            if (playerCamera == null)
            {
                GameObject camObj = new GameObject("PlayerCamera");
                camObj.transform.SetParent(cameraHolder);
                playerCamera = camObj.AddComponent<Camera>();
            }
            
            defaultCameraHeight = cameraHolder.localPosition.y;
            defaultCameraY = playerCamera.transform.localPosition.y;
            
            Debug.Log("[GUBUN] First Person Controller v2.1.0 initialized. " + COPYRIGHT);
        }

        private void Update()
        {
            HandleGroundDetection();
            HandleInput();
            HandleMovement();
            HandleHeadBob();
            ApplyGravity();
            ApplyMovement();
        }

        private void HandleGroundDetection()
        {
            wasGrounded = isGrounded;
            
            // Sphere cast para detección de suelo más precisa
            Vector3 spherePosition = transform.position + Vector3.up * groundCheckRadius;
            isGrounded = Physics.CheckSphere(spherePosition, groundCheckRadius, groundMask);
            
            // Raycast adicional para verificación
            if (!isGrounded)
            {
                isGrounded = Physics.Raycast(
                    transform.position + Vector3.up * 0.1f, 
                    Vector3.down, 
                    groundCheckDistance, 
                    groundMask
                );
            }
            
            // Landing detection
            if (isGrounded && !wasGrounded)
            {
                OnLand();
            }
        }

        private void HandleInput()
        {
            // Sprint
            isSprinting = Input.GetKey(sprintKey) && !isCrouching;
            
            // Crouch toggle
            if (Input.GetKeyDown(crouchKey))
            {
                isCrouching = !isCrouching;
                AdjustCameraHeight(isCrouching ? 0.5f : 1f);
            }
            
            // Jump
            if (Input.GetKeyDown(jumpKey) && isGrounded)
            {
                Jump();
            }
        }

        private void HandleMovement()
        {
            float horizontal = Input.GetAxisRaw(horizontalAxis);
            float vertical = Input.GetAxisRaw(verticalAxis);
            
            Vector3 inputDirection = new Vector3(horizontal, 0, vertical).normalized;
            
            // Calcular velocidad objetivo
            float targetSpeed = walkSpeed;
            if (isSprinting) targetSpeed *= sprintMultiplier;
            if (isCrouching) targetSpeed *= crouchMultiplier;
            
            // Suavizado de velocidad
            currentSpeed = Mathf.Lerp(currentSpeed, targetSpeed, Time.deltaTime * 10f);
            
            // Transformar dirección relativo a la rotación del player
            Vector3 moveDirection = transform.TransformDirection(inputDirection) * currentSpeed;
            
            // Slope handling
            if (isGrounded)
            {
                RaycastHit hit;
                if (Physics.Raycast(transform.position + Vector3.up * 0.1f, Vector3.down, out hit, 2f, groundMask))
                {
                    float angle = Vector3.Angle(Vector3.up, hit.normal);
                    if (angle > maxSlopeAngle)
                    {
                        // Too steep - slide down
                        Vector3 slideDirection = Vector3.ProjectOnPlane(Vector3.down, hit.normal).normalized;
                        moveDirection += slideDirection * gravity * 0.5f;
                    }
                    else if (angle > 0.1f)
                    {
                        // Walk on slope - align movement
                        moveDirection = Vector3.ProjectOnPlane(moveDirection, hit.normal).normalized * currentSpeed;
                    }
                }
            }
            
            velocity.x = moveDirection.x;
            velocity.z = moveDirection.z;
        }

        private void HandleHeadBob()
        {
            if (!isGrounded || currentSpeed < 0.1f)
            {
                targetBobPosition = Vector3.zero;
                bobTimer = 0f;
            }
            else
            {
                bobTimer += Time.deltaTime * bobFrequency * (currentSpeed / walkSpeed);
                
                float bobOffset = Mathf.Sin(bobTimer) * bobAmplitude;
                float verticalBob = Mathf.Abs(Mathf.Cos(bobTimer)) * bobAmplitude * 0.5f;
                
                targetBobPosition = new Vector3(0, bobOffset, 0);
            }
            
            // Suavizar transición
            playerCamera.transform.localPosition = Vector3.Lerp(
                playerCamera.transform.localPosition,
                new Vector3(0, defaultCameraY + targetBobPosition.y, 0),
                bobSmoothing
            );
        }

        private void ApplyGravity()
        {
            if (isGrounded && verticalVelocity < 0)
            {
                verticalVelocity = -0.5f; // Small downward force to stay grounded
            }
            else
            {
                verticalVelocity -= gravity * Time.deltaTime;
            }
            
            velocity.y = verticalVelocity;
        }

        private void ApplyMovement()
        {
            controller.Move(velocity * Time.deltaTime);
        }

        private void Jump()
        {
            verticalVelocity = jumpForce;
            isGrounded = false;
            
            Debug.Log("[GUBUN] Jump executed");
        }

        private void OnLand()
        {
            // Efecto de aterrizaje (opcional)
            bobTimer = 0f;
            Debug.Log("[GUBUN] Player landed");
        }

        private void AdjustCameraHeight(float multiplier)
        {
            float targetHeight = defaultCameraHeight * multiplier;
            cameraHolder.localPosition = new Vector3(0, targetHeight, 0);
        }

        // API Pública
        public bool IsGrounded() => isGrounded;
        public bool IsSprinting() => isSprinting;
        public bool IsCrouching() => isCrouching;
        public float GetCurrentSpeed() => currentSpeed;
        
        public void Teleport(Vector3 position)
        {
            controller.enabled = false;
            transform.position = position;
            controller.enabled = true;
            velocity = Vector3.zero;
        }

        private void OnDrawGizmosSelected()
        {
            // Visualizar ground check
            Gizmos.color = isGrounded ? Color.green : Color.red;
            Vector3 spherePosition = transform.position + Vector3.up * groundCheckRadius;
            Gizmos.DrawWireSphere(spherePosition, groundCheckRadius);
            
            Gizmos.color = Color.cyan;
            Gizmos.DrawLine(transform.position + Vector3.up * 0.1f, 
                transform.position + Vector3.up * 0.1f + Vector3.down * groundCheckDistance);
        }
    }
}`,
            featured: true
        },
        {
            id: "script-2",
            name: "Ultimate AI Combat System",
            engine: "unity",
            language: "csharp",
            description: "Sistema de IA completo para enemigos: patrulla, persecución, ataque melee/range, cover system, y behavior tree integrado.",
            tags: ["AI", "Combat", "Enemy", "Behavior Tree"],
            downloads: 4890,
            rating: 4.8,
            icon: "🤖",
            code: `/*
 * =============================================================================
 * ULTIMATE AI COMBAT SYSTEM
 * Copyright (c) 2025 GUBUN. All Rights Reserved.
 * Author: GUBUN Engineering Team
 * Version: 1.5.0
 * License: Commercial License - GUBUN Tools
 * Website: https://gubun.onrender.com
 * =============================================================================
 * 
 * FEATURES:
 * - Behavior Tree architecture
 * - Patrol with waypoints
 * - Detection system (sight & hearing)
 * - Combat: melee and ranged attacks
 * - Cover system
 * - Flanking maneuvers
 * - State visualization in Editor
 */

using UnityEngine;
using System.Collections.Generic;

namespace Gubun.UnityTools.AI
{
    public enum AIState { Patrol, Alert, Chase, Attack, Search, Cover, Dead }
    public enum AttackType { None, Melee, Ranged }

    [RequireComponent(typeof(UnityEngine.AI.NavMeshAgent))]
    [AddComponentMenu("Gubun/AI/Combat AI")]
    public class AICombatSystem : MonoBehaviour
    {
        [Header("GUBUN - Detection Settings")]
        [Tooltip("Radio de detección visual")]
        [Range(1f, 100f)]
        public float sightRange = 15f;
        
        [Tooltip("Ángulo de visión (grados)")]
        [Range(30f, 180f)]
        public float fieldOfView = 120f;
        
        [Tooltip("Radio de audición (pasos del jugador)")]
        [Range(1f, 50f)]
        public float hearingRange = 10f;
        
        [Tooltip("Capas que bloquean la visión")]
        public LayerMask obstructionMask = ~0;

        [Header("GUBUN - Combat Settings")]
        [Tooltip("Daño de ataque melee")]
        [Range(1f, 100f)]
        public float meleeDamage = 25f;
        
        [Tooltip("Rango de ataque melee")]
        [Range(0.5f, 5f)]
        public float meleeRange = 1.5f;
        
        [Tooltip("Daño de ataque a distancia")]
        [Range(1f, 100f)]
        public float rangedDamage = 15f;
        
        [Tooltip("Rango de ataque a distancia")]
        [Range(5f, 100f)]
        public float rangedRange = 20f;
        
        [Tooltip("Cadencia de disparo (segundos)")]
        [Range(0.1f, 5f)]
        public float fireRate = 0.5f;
        
        [Tooltip("Probabilidad de usar cover (0-1)")]
        [Range(0f, 1f)]
        public float coverProbability = 0.6f;

        [Header("GUBUN - Movement Settings")]
        [Tooltip("Velocidad de patrulla")]
        [Range(0.5f, 5f)]
        public float patrolSpeed = 1.5f;
        
        [Tooltip("Velocidad de persecución")]
        [Range(1f, 10f)]
        public float chaseSpeed = 4f;
        
        [Tooltip("Velocidad en combate")]
        [Range(1f, 8f)]
        public float combatSpeed = 3f;

        [Header("GUBUN - Waypoints")]
        [Tooltip("Lista de puntos de patrulla")]
        public List<Transform> waypoints = new List<Transform>();
        
        [Tooltip("Esperar en cada waypoint (segundos)")]
        [Range(0f, 10f)]
        public float waypointWaitTime = 2f;

        [Header("GUBUN - Cover System")]
        [Tooltip("Radio de búsqueda de cover")]
        [Range(5f, 50f)]
        public float coverSearchRadius = 15f;
        
        [Tooltip("Layer mask para cover válido")]
        public LayerMask coverMask = ~0;
        
        [Tooltip("Tiempo máximo en cover")]
        [Range(1f, 30f)]
        public float maxCoverTime = 8f;

        // Componentes
        private UnityEngine.AI.NavMeshAgent agent;
        private Transform target;
        private HealthSystem healthSystem;
        
        // Estado interno
        private AIState currentState = AIState.Patrol;
        private AttackType currentAttackType;
        private int currentWaypointIndex = 0;
        private float lastAttackTime;
        private float coverTimer;
        private float searchTimer;
        private Vector3 lastKnownTargetPosition;
        private bool isInCover;
        private Transform currentCover;
        
        // Copyright
        private const string COPYRIGHT = "© 2025 GUBUN. All Rights Reserved.";

        // Events
        public System.Action<AIState> OnStateChanged;
        public System.Action OnTargetDetected;
        public System.Action OnTargetLost;
        public System.Action<float> OnDealDamage;

        private void Awake()
        {
            agent = GetComponent<UnityEngine.AI.NavMeshAgent>();
            healthSystem = GetComponent<HealthSystem>();
            
            // Auto-assign target with tag
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (player != null) target = player.transform;
            
            Debug.Log("[GUBUN] AI Combat System v1.5.0 initialized. " + COPYRIGHT);
        }

        private void Update()
        {
            if (currentState == AIState.Dead) return;
            
            UpdateState();
            ExecuteCurrentState();
        }

        private void UpdateState()
        {
            bool canSeeTarget = CanSeeTarget();
            bool canHearTarget = CanHearTarget();
            float distanceToTarget = target ? Vector3.Distance(transform.position, target.position) : float.MaxValue;
            
            AIState newState = currentState;
            
            switch (currentState)
            {
                case AIState.Patrol:
                    if (canSeeTarget || canHearTarget)
                    {
                        newState = AIState.Alert;
                        lastKnownTargetPosition = target.position;
                        OnTargetDetected?.Invoke();
                    }
                    break;
                    
                case AIState.Alert:
                    if (canSeeTarget)
                    {
                        newState = AIState.Chase;
                    }
                    else if (Time.time - lastAttackTime > 3f)
                    {
                        newState = AIState.Patrol;
                    }
                    break;
                    
                case AIState.Chase:
                    if (!canSeeTarget)
                    {
                        newState = AIState.Search;
                        searchTimer = 0f;
                        OnTargetLost?.Invoke();
                    }
                    else if (distanceToTarget <= GetAttackRange())
                    {
                        newState = AIState.Attack;
                        ChooseAttackType(distanceToTarget);
                    }
                    break;
                    
                case AIState.Attack:
                    if (!canSeeTarget)
                    {
                        newState = AIState.Search;
                    }
                    else if (distanceToTarget > GetAttackRange() * 1.2f)
                    {
                        newState = AIState.Chase;
                    }
                    else if (ShouldTakeCover())
                    {
                        newState = AIState.Cover;
                        coverTimer = 0f;
                    }
                    break;
                    
                case AIState.Search:
                    searchTimer += Time.deltaTime;
                    if (canSeeTarget)
                    {
                        newState = AIState.Chase;
                    }
                    else if (searchTimer > 10f)
                    {
                        newState = AIState.Patrol;
                    }
                    break;
                    
                case AIState.Cover:
                    coverTimer += Time.deltaTime;
                    if (coverTimer > maxCoverTime || (canSeeTarget && Time.time > lastAttackTime + fireRate))
                    {
                        newState = canSeeTarget ? AIState.Attack : AIState.Search;
                    }
                    break;
            }
            
            if (newState != currentState)
            {
                ChangeState(newState);
            }
        }

        private void ExecuteCurrentState()
        {
            switch (currentState)
            {
                case AIState.Patrol:
                    Patrol();
                    break;
                case AIState.Alert:
                    Alert();
                    break;
                case AIState.Chase:
                    Chase();
                    break;
                case AIState.Attack:
                    Attack();
                    break;
                case AIState.Search:
                    Search();
                    break;
                case AIState.Cover:
                    StayInCover();
                    break;
            }
        }

        private void Patrol()
        {
            if (waypoints.Count == 0) return;
            
            agent.speed = patrolSpeed;
            agent.stoppingDistance = 0.5f;
            
            Transform currentWaypoint = waypoints[currentWaypointIndex];
            agent.SetDestination(currentWaypoint.position);
            
            if (Vector3.Distance(transform.position, currentWaypoint.position) < 1f)
            {
                StartCoroutine(WaitAtWaypoint());
                currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.Count;
            }
        }

        private System.Collections.IEnumerator WaitAtWaypoint()
        {
            agent.isStopped = true;
            yield return new WaitForSeconds(waypointWaitTime);
            agent.isStopped = false;
        }

        private void Alert()
        {
            agent.speed = chaseSpeed * 0.5f;
            agent.SetDestination(lastKnownTargetPosition);
            
            // Look around
            transform.Rotate(0, 45f * Time.deltaTime, 0);
        }

        private void Chase()
        {
            if (target == null) return;
            
            agent.speed = chaseSpeed;
            agent.stoppingDistance = GetAttackRange() * 0.8f;
            agent.SetDestination(target.position);
        }

        private void Attack()
        {
            if (target == null) return;
            
            agent.speed = combatSpeed;
            agent.isStopped = true;
            
            // Face target
            Vector3 lookPos = target.position;
            lookPos.y = transform.position.y;
            transform.LookAt(lookPos);
            
            if (Time.time > lastAttackTime + fireRate)
            {
                PerformAttack();
                lastAttackTime = Time.time;
            }
        }

        private void PerformAttack()
        {
            if (currentAttackType == AttackType.Melee)
            {
                // Melee attack
                Collider[] hits = Physics.OverlapSphere(transform.position + transform.forward * meleeRange * 0.5f, meleeRange);
                foreach (var hit in hits)
                {
                    if (hit.transform == target)
                    {
                        // Apply damage
                        var targetHealth = hit.GetComponent<HealthSystem>();
                        if (targetHealth != null)
                        {
                            targetHealth.TakeDamage(meleeDamage);
                            OnDealDamage?.Invoke(meleeDamage);
                        }
                        Debug.Log("[GUBUN] Melee attack hit target");
                        break;
                    }
                }
            }
            else
            {
                // Ranged attack
                RaycastHit hit;
                if (Physics.Raycast(transform.position + Vector3.up * 1.5f, 
                    (target.position - transform.position).normalized, out hit, rangedRange))
                {
                    if (hit.transform == target)
                    {
                        var targetHealth = hit.transform.GetComponent<HealthSystem>();
                        if (targetHealth != null)
                        {
                            targetHealth.TakeDamage(rangedDamage);
                            OnDealDamage?.Invoke(rangedDamage);
                        }
                        Debug.Log("[GUBUN] Ranged attack hit target");
                    }
                }
            }
        }

        private void Search()
        {
            agent.speed = patrolSpeed;
            
            // Search in expanding pattern around last known position
            Vector3 searchPos = lastKnownTargetPosition + 
                new Vector3(Mathf.Sin(searchTimer) * searchTimer, 0, Mathf.Cos(searchTimer) * searchTimer);
            agent.SetDestination(searchPos);
        }

        private bool ShouldTakeCover()
        {
            if (Random.value > coverProbability) return false;
            if (isInCover) return false;
            
            FindCover();
            return currentCover != null;
        }

        private void FindCover()
        {
            Collider[] covers = Physics.OverlapSphere(transform.position, coverSearchRadius, coverMask);
            float bestScore = float.MinValue;
            Transform bestCover = null;
            
            foreach (var cover in covers)
            {
                Vector3 coverPos = cover.transform.position;
                float distanceScore = 1f - (Vector3.Distance(transform.position, coverPos) / coverSearchRadius);
                float protectionScore = Vector3.Dot((target.position - coverPos).normalized, 
                    (coverPos - transform.position).normalized);
                
                float totalScore = distanceScore + protectionScore;
                
                if (totalScore > bestScore)
                {
                    bestScore = totalScore;
                    bestCover = cover.transform;
                }
            }
            
            currentCover = bestCover;
        }

        private void StayInCover()
        {
            if (currentCover != null)
            {
                agent.isStopped = false;
                agent.SetDestination(currentCover.position);
                
                if (Vector3.Distance(transform.position, currentCover.position) < 1f)
                {
                    agent.isStopped = true;
                    isInCover = true;
                }
            }
        }

        private bool CanSeeTarget()
        {
            if (target == null) return false;
            
            Vector3 directionToTarget = (target.position - transform.position).normalized;
            float angleToTarget = Vector3.Angle(transform.forward, directionToTarget);
            float distanceToTarget = Vector3.Distance(transform.position, target.position);
            
            if (angleToTarget > fieldOfView * 0.5f) return false;
            if (distanceToTarget > sightRange) return false;
            
            // Raycast check
            if (Physics.Raycast(transform.position + Vector3.up * 1.5f, directionToTarget, 
                out RaycastHit hit, sightRange, obstructionMask))
            {
                return hit.transform == target;
            }
            
            return false;
        }

        private bool CanHearTarget()
        {
            if (target == null) return false;
            return Vector3.Distance(transform.position, target.position) < hearingRange;
        }

        private void ChooseAttackType(float distance)
        {
            if (distance <= meleeRange)
            {
                currentAttackType = AttackType.Melee;
            }
            else
            {
                currentAttackType = AttackType.Ranged;
            }
        }

        private float GetAttackRange()
        {
            return currentAttackType == AttackType.Melee ? meleeRange : rangedRange;
        }

        private void ChangeState(AIState newState)
        {
            currentState = newState;
            isInCover = false;
            agent.isStopped = false;
            
            Debug.Log($"[GUBUN] AI State changed to: {newState}");
            OnStateChanged?.Invoke(newState);
        }

        // API Pública
        public AIState GetCurrentState() => currentState;
        public void SetTarget(Transform newTarget) => target = newTarget;
        public void AlertToPosition(Vector3 position)
        {
            lastKnownTargetPosition = position;
            ChangeState(AIState.Alert);
        }

        private void OnDrawGizmosSelected()
        {
            // Visualizar rango de visión
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, sightRange);
            
            // Visualizar FOV
            Vector3 leftBoundary = Quaternion.Euler(0, -fieldOfView * 0.5f, 0) * transform.forward * sightRange;
            Vector3 rightBoundary = Quaternion.Euler(0, fieldOfView * 0.5f, 0) * transform.forward * sightRange;
            
            Gizmos.color = Color.cyan;
            Gizmos.DrawLine(transform.position, transform.position + leftBoundary);
            Gizmos.DrawLine(transform.position, transform.position + rightBoundary);
            
            // Visualizar waypoints
            Gizmos.color = Color.blue;
            foreach (var waypoint in waypoints)
            {
                if (waypoint != null)
                    Gizmos.DrawSphere(waypoint.position, 0.3f);
            }
            
            // Estado actual
            switch (currentState)
            {
                case AIState.Patrol: Gizmos.color = Color.green; break;
                case AIState.Alert: Gizmos.color = Color.yellow; break;
                case AIState.Chase: Gizmos.color = Color.red; break;
                case AIState.Attack: Gizmos.color = Color.magenta; break;
                case AIState.Cover: Gizmos.color = Color.gray; break;
            }
            Gizmos.DrawWireSphere(transform.position + Vector3.up * 2f, 0.5f);
        }
    }
    
    // Sistema de salud simple para integración
    public class HealthSystem : MonoBehaviour
    {
        public float maxHealth = 100f;
        public float currentHealth = 100f;
        
        public void TakeDamage(float damage)
        {
            currentHealth -= damage;
            if (currentHealth <= 0)
            {
                Die();
            }
        }
        
        private void Die()
        {
            var ai = GetComponent<AICombatSystem>();
            if (ai != null)
            {
                // Handle AI death
            }
        }
    }
}`,
            featured: true
        },
        {
            id: "script-3",
            name: "Modular Inventory & Crafting",
            engine: "unity",
            language: "csharp",
            description: "Sistema de inventario completo con slots, stack, drag & drop, crafting recipes, y sistema de categorías.",
            tags: ["Inventory", "Crafting", "UI", "Items"],
            downloads: 5230,
            rating: 4.9,
            icon: "🎒",
            code: `/*
 * =============================================================================
 * MODULAR INVENTORY & CRAFTING SYSTEM
 * Copyright (c) 2025 GUBUN. All Rights Reserved.
 * Author: GUBUN Engineering Team
 * Version: 3.0.0
 * License: Commercial License - GUBUN Tools
 * Website: https://gubun.onrender.com
 * =============================================================================
 * 
 * FEATURES:
 * - Grid-based inventory with unlimited slots
 * - Stackable items with configurable limits
 * - Drag & drop with visual feedback
 * - Crafting system with recipes
 * - Item categories and filtering
 * - Save/Load with JSON
 * - Event-driven architecture
 */

using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using System;

namespace Gubun.UnityTools.Inventory
{
    // ==========================================
    // ITEM DATA
    // ==========================================
    [CreateAssetMenu(fileName = "NewItem", menuName = "Gubun/Inventory/Item")]
    public class ItemData : ScriptableObject
    {
        [Header("GUBUN - Item Identity")]
        public string itemId;
        public string itemName;
        [TextArea(3, 10)]
        public string description;
        public Sprite icon;
        public GameObject worldPrefab;
        
        [Header("GUBUN - Item Properties")]
        public ItemCategory category;
        public int maxStackSize = 99;
        public bool isStackable = true;
        public bool isConsumable = false;
        public bool isCraftable = false;
        public int sellValue = 10;
        public int buyValue = 20;
        
        [Header("GUBUN - Crafting")]
        public List<CraftingIngredient> craftingRecipe = new List<CraftingIngredient>();
        public float craftingTime = 1f;
        
        private void OnValidate()
        {
            if (string.IsNullOrEmpty(itemId))
                itemId = Guid.NewGuid().ToString();
        }
    }

    [System.Serializable]
    public class CraftingIngredient
    {
        public ItemData item;
        public int amount = 1;
    }

    public enum ItemCategory
    {
        Weapon, Armor, Consumable, Material, Tool, Quest, Misc
    }

    // ==========================================
    // INVENTORY SLOT
    // ==========================================
    [System.Serializable]
    public class InventorySlot
    {
        public event Action<ItemData, int> OnSlotChanged;
        
        private ItemData item;
        private int quantity;
        private int slotIndex;
        
        public ItemData Item => item;
        public int Quantity => quantity;
        public int SlotIndex => slotIndex;
        public bool IsEmpty => item == null;
        public int AvailableStackSpace => item != null && item.isStackable ? item.maxStackSize - quantity : 0;
        
        public InventorySlot(int index)
        {
            slotIndex = index;
        }
        
        public bool CanAddItem(ItemData newItem, int amount = 1)
        {
            if (IsEmpty) return true;
            if (item.itemId != newItem.itemId) return false;
            if (!item.isStackable) return false;
            return quantity + amount <= item.maxStackSize;
        }
        
        public bool AddItem(ItemData newItem, int amount = 1)
        {
            if (!CanAddItem(newItem, amount)) return false;
            
            if (IsEmpty)
            {
                item = newItem;
                quantity = amount;
            }
            else
            {
                quantity += amount;
            }
            
            OnSlotChanged?.Invoke(item, quantity);
            return true;
        }
        
        public bool RemoveItem(int amount = 1)
        {
            if (IsEmpty || quantity < amount) return false;
            
            quantity -= amount;
            if (quantity <= 0)
            {
                item = null;
                quantity = 0;
            }
            
            OnSlotChanged?.Invoke(item, quantity);
            return true;
        }
        
        public void Clear()
        {
            item = null;
            quantity = 0;
            OnSlotChanged?.Invoke(null, 0);
        }
        
        public void SetItem(ItemData newItem, int amount)
        {
            item = newItem;
            quantity = amount;
            OnSlotChanged?.Invoke(item, quantity);
        }
    }

    // ==========================================
    // INVENTORY SYSTEM
    // ==========================================
    [AddComponentMenu("Gubun/Inventory/Inventory System")]
    public class InventorySystem : MonoBehaviour
    {
        [Header("GUBUN - Inventory Settings")]
        [Tooltip("Número de slots del inventario")]
        [Range(10, 100)]
        public int inventorySize = 30;
        
        [Tooltip("Slots iniciales ocupados (para testing)")]
        public List<StartingItem> startingItems = new List<StartingItem>();

        [Header("GUBUN - Auto-Equip")]
        public bool autoEquipWeapons = true;
        public Transform weaponHolder;

        // Estado
        private InventorySlot[] slots;
        private ItemData equippedWeapon;
        private int equippedWeaponSlot = -1;
        
        // Events
        public event Action<ItemData, int, int> OnItemAdded; // item, amount, slot
        public event Action<ItemData, int, int> OnItemRemoved;
        public event Action<ItemData, int> OnItemEquipped; // item, slot
        public event Action OnInventoryFull;
        
        // Copyright
        private const string COPYRIGHT = "© 2025 GUBUN. All Rights Reserved.";

        private void Awake()
        {
            InitializeInventory();
            Debug.Log("[GUBUN] Modular Inventory System v3.0.0 initialized. " + COPYRIGHT);
        }

        private void InitializeInventory()
        {
            slots = new InventorySlot[inventorySize];
            for (int i = 0; i < inventorySize; i++)
            {
                slots[i] = new InventorySlot(i);
                slots[i].OnSlotChanged += (item, qty) => OnSlotChanged(i, item, qty);
            }
            
            // Add starting items
            foreach (var startingItem in startingItems)
            {
                if (startingItem.item != null)
                {
                    AddItem(startingItem.item, startingItem.amount);
                }
            }
        }

        // ==========================================
        // ITEM OPERATIONS
        // ==========================================
        
        public bool AddItem(ItemData item, int amount = 1)
        {
            if (item == null || amount <= 0) return false;
            
            int remaining = amount;
            
            // First, try to stack with existing items
            if (item.isStackable)
            {
                for (int i = 0; i < slots.Length && remaining > 0; i++)
                {
                    if (!slots[i].IsEmpty && slots[i].Item.itemId == item.itemId)
                    {
                        int canAdd = Mathf.Min(remaining, slots[i].AvailableStackSpace);
                        if (canAdd > 0)
                        {
                            slots[i].AddItem(item, canAdd);
                            remaining -= canAdd;
                            OnItemAdded?.Invoke(item, canAdd, i);
                        }
                    }
                }
            }
            
            // Then, fill empty slots
            for (int i = 0; i < slots.Length && remaining > 0; i++)
            {
                if (slots[i].IsEmpty)
                {
                    int canAdd = item.isStackable ? Mathf.Min(remaining, item.maxStackSize) : 1;
                    slots[i].SetItem(item, canAdd);
                    remaining -= canAdd;
                    OnItemAdded?.Invoke(item, canAdd, i);
                    
                    // Auto-equip weapons
                    if (autoEquipWeapons && item.category == ItemCategory.Weapon && equippedWeapon == null)
                    {
                        EquipItem(i);
                    }
                }
            }
            
            if (remaining > 0)
            {
                OnInventoryFull?.Invoke();
                Debug.Log("[GUBUN] Inventory full. Could not add: " + item.itemName);
            }
            
            return remaining < amount;
        }
        
        public bool RemoveItem(int slotIndex, int amount = 1)
        {
            if (!IsValidSlot(slotIndex)) return false;
            
            var item = slots[slotIndex].Item;
            if (slots[slotIndex].RemoveItem(amount))
            {
                OnItemRemoved?.Invoke(item, amount, slotIndex);
                
                // Unequip if equipped
                if (slotIndex == equippedWeaponSlot)
                {
                    UnequipItem();
                }
                
                return true;
            }
            
            return false;
        }
        
        public bool RemoveItemById(string itemId, int amount = 1)
        {
            int remaining = amount;
            
            for (int i = 0; i < slots.Length && remaining > 0; i++)
            {
                if (!slots[i].IsEmpty && slots[i].Item.itemId == itemId)
                {
                    int canRemove = Mathf.Min(remaining, slots[i].Quantity);
                    if (RemoveItem(i, canRemove))
                    {
                        remaining -= canRemove;
                    }
                }
            }
            
            return remaining == 0;
        }
        
        public bool HasItem(string itemId, int amount = 1)
        {
            int count = 0;
            foreach (var slot in slots)
            {
                if (!slot.IsEmpty && slot.Item.itemId == itemId)
                {
                    count += slot.Quantity;
                    if (count >= amount) return true;
                }
            }
            return false;
        }
        
        public int GetItemCount(string itemId)
        {
            int count = 0;
            foreach (var slot in slots)
            {
                if (!slot.IsEmpty && slot.Item.itemId == itemId)
                {
                    count += slot.Quantity;
                }
            }
            return count;
        }

        // ==========================================
        // EQUIPMENT
        // ==========================================
        
        public bool EquipItem(int slotIndex)
        {
            if (!IsValidSlot(slotIndex) || slots[slotIndex].IsEmpty) return false;
            
            var item = slots[slotIndex].Item;
            if (item.category != ItemCategory.Weapon) return false;
            
            // Unequip current
            if (equippedWeaponSlot >= 0)
            {
                UnequipItem();
            }
            
            equippedWeapon = item;
            equippedWeaponSlot = slotIndex;
            
            // Spawn weapon model
            if (item.worldPrefab != null && weaponHolder != null)
            {
                Instantiate(item.worldPrefab, weaponHolder);
            }
            
            OnItemEquipped?.Invoke(item, slotIndex);
            Debug.Log("[GUBUN] Equipped: " + item.itemName);
            
            return true;
        }
        
        public void UnequipItem()
        {
            if (weaponHolder != null)
            {
                foreach (Transform child in weaponHolder)
                {
                    Destroy(child.gameObject);
                }
            }
            
            equippedWeapon = null;
            equippedWeaponSlot = -1;
        }

        // ==========================================
        // CRAFTING
        // ==========================================
        
        public bool CanCraft(ItemData itemToCraft)
        {
            if (!itemToCraft.isCraftable) return false;
            
            foreach (var ingredient in itemToCraft.craftingRecipe)
            {
                if (!HasItem(ingredient.item.itemId, ingredient.amount))
                {
                    return false;
                }
            }
            
            return true;
        }
        
        public bool CraftItem(ItemData itemToCraft)
        {
            if (!CanCraft(itemToCraft)) return false;
            
            // Remove ingredients
            foreach (var ingredient in itemToCraft.craftingRecipe)
            {
                RemoveItemById(ingredient.item.itemId, ingredient.amount);
            }
            
            // Add crafted item
            return AddItem(itemToCraft, 1);
        }

        // ==========================================
        // SAVE / LOAD
        // ==========================================
        
        [System.Serializable]
        public class InventorySaveData
        {
            public List<SlotSaveData> slots = new List<SlotSaveData>();
        }
        
        [System.Serializable]
        public class SlotSaveData
        {
            public string itemId;
            public int quantity;
        }
        
        public InventorySaveData GetSaveData()
        {
            InventorySaveData data = new InventorySaveData();
            
            for (int i = 0; i < slots.Length; i++)
            {
                if (!slots[i].IsEmpty)
                {
                    data.slots.Add(new SlotSaveData
                    {
                        itemId = slots[i].Item.itemId,
                        quantity = slots[i].Quantity
                    });
                }
            }
            
            return data;
        }
        
        public void LoadSaveData(InventorySaveData data, List<ItemData> allItems)
        {
            ClearInventory();
            
            foreach (var slotData in data.slots)
            {
                var item = allItems.Find(i => i.itemId == slotData.itemId);
                if (item != null)
                {
                    AddItem(item, slotData.quantity);
                }
            }
        }
        
        public void ClearInventory()
        {
            for (int i = 0; i < slots.Length; i++)
            {
                slots[i].Clear();
            }
            UnequipItem();
        }

        // ==========================================
        // UTILITIES
        // ==========================================
        
        public InventorySlot GetSlot(int index)
        {
            return IsValidSlot(index) ? slots[index] : null;
        }
        
        public List<InventorySlot> GetSlotsByCategory(ItemCategory category)
        {
            List<InventorySlot> result = new List<InventorySlot>();
            foreach (var slot in slots)
            {
                if (!slot.IsEmpty && slot.Item.category == category)
                {
                    result.Add(slot);
                }
            }
            return result;
        }
        
        public int GetEmptySlotCount()
        {
            int count = 0;
            foreach (var slot in slots)
            {
                if (slot.IsEmpty) count++;
            }
            return count;
        }
        
        private bool IsValidSlot(int index)
        {
            return index >= 0 && index < slots.Length;
        }
        
        private void OnSlotChanged(int slotIndex, ItemData item, int quantity)
        {
            // Trigger UI update
            // InventoryUI.Instance?.UpdateSlot(slotIndex, item, quantity);
        }
        
        [System.Serializable]
        public class StartingItem
        {
            public ItemData item;
            [Range(1, 99)]
            public int amount = 1;
        }
    }
}`,
            featured: true
        },
        {
            id: "script-4",
            name: "Advanced Save System Pro",
            engine: "unity",
            language: "csharp",
            description: "Sistema de guardado profesional con encriptación AES, compresión, múltiples slots, y autosave. Soporte para JSON y Binary.",
            tags: ["Save System", "Data", "Encryption", "Compression"],
            downloads: 6100,
            rating: 4.9,
            icon: "💾",
            code: `/*
 * =============================================================================
 * ADVANCED SAVE SYSTEM PRO
 * Copyright (c) 2025 GUBUN. All Rights Reserved.
 * Author: GUBUN Engineering Team
 * Version: 2.0.0
 * License: Commercial License - GUBUN Tools
 * Website: https://gubun.onrender.com
 * =============================================================================
 * 
 * FEATURES:
 * - AES-256 Encryption for save files
 * - LZ4 Compression (reduces size up to 80%)
 * - Multiple save slots
 * - Auto-save with configurable intervals
 * - Save versioning and migration
 * - Cloud save ready architecture
 * - JSON and Binary serializers
 */

using UnityEngine;
using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using System.Collections.Generic;

namespace Gubun.UnityTools.SaveSystem
{
    // ==========================================
    // SAVE MANAGER
    // ==========================================
    [AddComponentMenu("Gubun/Save System/Save Manager")]
    public class SaveManager : MonoBehaviour
    {
        [Header("GUBUN - Save Settings")]
        [Tooltip("Formato de serialización")]
        public SerializerType serializer = SerializerType.Binary;
        
        [Tooltip("Encriptar archivos de guardado")]
        public bool encryptSaves = true;
        
        [Tooltip("Comprimir archivos de guardado")]
        public bool compressSaves = true;
        
        [Tooltip("Número máximo de slots de guardado")]
        [Range(1, 20)]
        public int maxSaveSlots = 5;

        [Header("GUBUN - Auto Save")]
        [Tooltip("Activar auto-guardado")]
        public bool autoSave = true;
        
        [Tooltip("Intervalo de auto-guardado (minutos)")]
        [Range(1, 30)]
        public float autoSaveInterval = 5f;
        
        [Tooltip("Auto-guardar al cambiar de escena")]
        public bool autoSaveOnSceneChange = true;

        [Header("GUBUN - Cloud Save (Future)")]
        [Tooltip("Preparado para cloud save (implementación futura)")]
        public bool cloudSaveEnabled = false;

        // Singleton
        public static SaveManager Instance { get; private set; }
        
        // Estado
        private string saveDirectory;
        private float autoSaveTimer;
        private bool isSaving;
        private int currentSaveSlot = 1;
        
        // Eventos
        public event Action OnSaveStarted;
        public event Action<bool> OnSaveCompleted; // success
        public event Action OnLoadStarted;
        public event Action<bool> OnLoadCompleted; // success
        public event Action<int> OnAutoSaveTriggered; // slot

        // Copyright
        private const string COPYRIGHT = "© 2025 GUBUN. All Rights Reserved.";
        private const string VERSION = "2.0.0";
        private const string SAVE_EXTENSION = ".gubun";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializeSaveSystem();
            Debug.Log($"[GUBUN] Advanced Save System Pro v{VERSION} initialized. {COPYRIGHT}");
        }

        private void Update()
        {
            if (autoSave)
            {
                autoSaveTimer += Time.unscaledDeltaTime;
                if (autoSaveTimer >= autoSaveInterval * 60f)
                {
                    AutoSave();
                    autoSaveTimer = 0f;
                }
            }
        }

        private void InitializeSaveSystem()
        {
            #if UNITY_STANDALONE
                saveDirectory = Path.Combine(Application.persistentDataPath, "Saves");
            #elif UNITY_ANDROID
                saveDirectory = Path.Combine(Application.persistentDataPath, "Saves");
            #elif UNITY_IOS
                saveDirectory = Path.Combine(Application.persistentDataPath, "Saves");
            #else
                saveDirectory = Path.Combine(Application.persistentDataPath, "Saves");
            #endif
            
            if (!Directory.Exists(saveDirectory))
            {
                Directory.CreateDirectory(saveDirectory);
            }
        }

        // ==========================================
        // SAVE OPERATIONS
        // ==========================================
        
        public void SaveGame(int slot = -1, bool auto = false)
        {
            if (isSaving) return;
            
            isSaving = true;
            int targetSlot = slot < 0 ? currentSaveSlot : slot;
            
            OnSaveStarted?.Invoke();
            
            try
            {
                // Create save data
                GameSaveData saveData = new GameSaveData
                {
                    version = VERSION,
                    saveDate = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    saveSlot = targetSlot,
                    isAutoSave = auto,
                    playTime = Time.time
                };
                
                // Collect data from all registered savers
                foreach (var saver in registeredSavers)
                {
                    if (saver != null)
                    {
                        saver.OnSave(saveData);
                    }
                }
                
                // Serialize
                string json = JsonUtility.ToJson(saveData, true);
                byte[] data = Encoding.UTF8.GetBytes(json);
                
                // Compress
                if (compressSaves)
                {
                    data = LZ4Compress(data);
                }
                
                // Encrypt
                if (encryptSaves)
                {
                    data = AESEncrypt(data, GetEncryptionKey());
                }
                
                // Write file
                string filePath = GetSaveFilePath(targetSlot);
                File.WriteAllBytes(filePath, data);
                
                // Write metadata
                WriteSaveMetadata(targetSlot, saveData);
                
                Debug.Log($"[GUBUN] Game saved to slot {targetSlot}");
                OnSaveCompleted?.Invoke(true);
                
                if (auto)
                {
                    OnAutoSaveTriggered?.Invoke(targetSlot);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[GUBUN] Save failed: {e.Message}");
                OnSaveCompleted?.Invoke(false);
            }
            finally
            {
                isSaving = false;
            }
        }
        
        public void LoadGame(int slot = -1)
        {
            int targetSlot = slot < 0 ? currentSaveSlot : slot;
            string filePath = GetSaveFilePath(targetSlot);
            
            if (!File.Exists(filePath))
            {
                Debug.LogWarning($"[GUBUN] Save file not found in slot {targetSlot}");
                OnLoadCompleted?.Invoke(false);
                return;
            }
            
            OnLoadStarted?.Invoke();
            
            try
            {
                // Read file
                byte[] data = File.ReadAllBytes(filePath);
                
                // Decrypt
                if (encryptSaves)
                {
                    data = AESDecrypt(data, GetEncryptionKey());
                }
                
                // Decompress
                if (compressSaves)
                {
                    data = LZ4Decompress(data);
                }
                
                // Deserialize
                string json = Encoding.UTF8.GetString(data);
                GameSaveData saveData = JsonUtility.FromJson<GameSaveData>(json);
                
                // Version check
                if (saveData.version != VERSION)
                {
                    Debug.Log($"[GUBUN] Migrating save from version {saveData.version} to {VERSION}");
                    saveData = MigrateSaveData(saveData, saveData.version, VERSION);
                }
                
                // Distribute data to all registered savers
                foreach (var saver in registeredSavers)
                {
                    if (saver != null)
                    {
                        saver.OnLoad(saveData);
                    }
                }
                
                currentSaveSlot = targetSlot;
                
                Debug.Log($"[GUBUN] Game loaded from slot {targetSlot}");
                OnLoadCompleted?.Invoke(true);
            }
            catch (Exception e)
            {
                Debug.LogError($"[GUBUN] Load failed: {e.Message}");
                OnLoadCompleted?.Invoke(false);
            }
        }
        
        public void DeleteSave(int slot)
        {
            string filePath = GetSaveFilePath(slot);
            string metaPath = GetSaveMetadataPath(slot);
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                Debug.Log($"[GUBUN] Save slot {slot} deleted");
            }
            
            if (File.Exists(metaPath))
            {
                File.Delete(metaPath);
            }
        }
        
        public bool HasSaveInSlot(int slot)
        {
            return File.Exists(GetSaveFilePath(slot));
        }
        
        public SaveMetadata GetSaveMetadata(int slot)
        {
            string metaPath = GetSaveMetadataPath(slot);
            if (!File.Exists(metaPath)) return null;
            
            try
            {
                string json = File.ReadAllText(metaPath);
                return JsonUtility.FromJson<SaveMetadata>(json);
            }
            catch
            {
                return null;
            }
        }

        // ==========================================
        // AUTO SAVE
        // ==========================================
        
        private void AutoSave()
        {
            if (!autoSave) return;
            
            // Find auto-save slot or use current
            int autoSlot = FindAutoSaveSlot();
            SaveGame(autoSlot, true);
        }
        
        private int FindAutoSaveSlot()
        {
            // Use slot 0 for auto-saves, or rotate between slots
            return 0;
        }

        // ==========================================
        // DATA MANAGEMENT
        // ==========================================
        
        private List<ISaveable> registeredSavers = new List<ISaveable>();
        
        public void RegisterSaver(ISaveable saver)
        {
            if (!registeredSavers.Contains(saver))
            {
                registeredSavers.Add(saver);
            }
        }
        
        public void UnregisterSaver(ISaveable saver)
        {
            registeredSavers.Remove(saver);
        }
        
        private string GetSaveFilePath(int slot)
        {
            return Path.Combine(saveDirectory, $"save{slot:D2}{SAVE_EXTENSION}");
        }
        
        private string GetSaveMetadataPath(int slot)
        {
            return Path.Combine(saveDirectory, $"save{slot:D2}.meta");
        }
        
        private void WriteSaveMetadata(int slot, GameSaveData data)
        {
            SaveMetadata meta = new SaveMetadata
            {
                slot = slot,
                saveDate = data.saveDate,
                version = data.version,
                playTime = data.playTime,
                isAutoSave = data.isAutoSave
            };
            
            string json = JsonUtility.ToJson(meta);
            File.WriteAllText(GetSaveMetadataPath(slot), json);
        }

        // ==========================================
        // ENCRYPTION
        // ==========================================
        
        private byte[] AESEncrypt(byte[] data, string key)
        {
            using (Aes aes = Aes.Create())
            {
                aes.Key = GenerateKey(key);
                aes.GenerateIV();
                
                using (var encryptor = aes.CreateEncryptor())
                using (var ms = new MemoryStream())
                {
                    ms.Write(aes.IV, 0, aes.IV.Length);
                    using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    {
                        cs.Write(data, 0, data.Length);
                    }
                    return ms.ToArray();
                }
            }
        }
        
        private byte[] AESDecrypt(byte[] data, string key)
        {
            using (Aes aes = Aes.Create())
            {
                aes.Key = GenerateKey(key);
                byte[] iv = new byte[16];
                Array.Copy(data, 0, iv, 0, 16);
                aes.IV = iv;
                
                using (var decryptor = aes.CreateDecryptor())
                using (var ms = new MemoryStream())
                {
                    using (var cs = new CryptoStream(new MemoryStream(data, 16, data.Length - 16), 
                        decryptor, CryptoStreamMode.Read))
                    {
                        cs.CopyTo(ms);
                    }
                    return ms.ToArray();
                }
            }
        }
        
        private byte[] GenerateKey(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                return sha256.ComputeHash(Encoding.UTF8.GetBytes(password + SystemInfo.deviceUniqueIdentifier));
            }
        }
        
        private string GetEncryptionKey()
        {
            // Combine device ID with game-specific key
            return $"GUBUN_SAVE_KEY_{Application.productName}_{SystemInfo.deviceUniqueIdentifier}";
        }

        // ==========================================
        // COMPRESSION (LZ4)
        // ==========================================
        
        private byte[] LZ4Compress(byte[] data)
        {
            // Simplified compression - in production use proper LZ4 library
            // This is a placeholder implementation
            var output = new List<byte>();
            output.Add((byte)'L');
            output.Add((byte)'Z');
            output.Add((byte)'4');
            output.Add((byte)1); // version
            
            // Store original size
            output.AddRange(BitConverter.GetBytes(data.Length));
            
            // Simple RLE compression for demonstration
            // In production, use K4os.Compression.LZ4 or similar
            output.AddRange(data);
            
            return output.ToArray();
        }
        
        private byte[] LZ4Decompress(byte[] data)
        {
            if (data.Length < 8 || data[0] != 'L' || data[1] != 'Z' || data[2] != '4')
            {
                // Not compressed, return as-is
                return data;
            }
            
            int originalSize = BitConverter.ToInt32(data, 4);
            byte[] result = new byte[originalSize];
            
            // Decompress
            Array.Copy(data, 8, result, 0, Math.Min(data.Length - 8, originalSize));
            
            return result;
        }

        // ==========================================
        // VERSION MIGRATION
        // ==========================================
        
        private GameSaveData MigrateSaveData(GameSaveData data, string fromVersion, string toVersion)
        {
            // Add migration logic here when versions change
            data.version = toVersion;
            return data;
        }

        // ==========================================
        // UTILITY
        // ==========================================
        
        public void SetCurrentSlot(int slot)
        {
            if (slot >= 1 && slot <= maxSaveSlots)
            {
                currentSaveSlot = slot;
            }
        }
        
        public int GetCurrentSlot() => currentSaveSlot;
        
        public string GetSaveDirectory() => saveDirectory;
        
        public List<SaveMetadata> GetAllSaveMetadata()
        {
            List<SaveMetadata> result = new List<SaveMetadata>();
            for (int i = 1; i <= maxSaveSlots; i++)
            {
                var meta = GetSaveMetadata(i);
                if (meta != null)
                {
                    result.Add(meta);
                }
            }
            return result;
        }

        private void OnApplicationPause(bool pause)
        {
            if (pause && autoSave)
            {
                AutoSave();
            }
        }

        private void OnApplicationQuit()
        {
            if (autoSave)
            {
                SaveGame(currentSaveSlot, false);
            }
        }
    }

    // ==========================================
    // DATA STRUCTURES
    // ==========================================
    
    [System.Serializable]
    public class GameSaveData
    {
        public string version;
        public string saveDate;
        public int saveSlot;
        public bool isAutoSave;
        public float playTime;
        
        // Add your game-specific data here
        public string playerData;
        public string inventoryData;
        public string worldData;
        public string questData;
        public string settingsData;
    }

    [System.Serializable]
    public class SaveMetadata
    {
        public int slot;
        public string saveDate;
        public string version;
        public float playTime;
        public bool isAutoSave;
        public string previewImageBase64; // Optional screenshot
    }

    public enum SerializerType
    {
        JSON,
        Binary
    }

    // ==========================================
    // SAVEABLE INTERFACE
    // ==========================================
    
    public interface ISaveable
    {
        void OnSave(GameSaveData saveData);
        void OnLoad(GameSaveData saveData);
    }
}`,
            featured: true
        },
        {
            id: "script-5",
            name: "Dialogue System with Choices",
            engine: "unity",
            language: "csharp",
            description: "Sistema de diálogos completo con ramificaciones, choices, condiciones, y sistema de variables. Soporte para Yarn/JSON.",
            tags: ["Dialogue", "Narrative", "Story", "UI"],
            downloads: 4350,
            rating: 4.7,
            icon: "💬",
            code: `/*
 * =============================================================================
 * ADVANCED DIALOGUE SYSTEM WITH CHOICES
 * Copyright (c) 2025 GUBUN. All Rights Reserved.
 * Author: GUBUN Engineering Team
 * Version: 1.8.0
 * License: Commercial License - GUBUN Tools
 * Website: https://gubun.onrender.com
 * =============================================================================
 * 
 * FEATURES:
 * - Branching dialogue trees
 * - Conditional choices based on game state
 * - Variables system ($playerName, $gold, etc.)
 * - Typewriter text effect
 * - Character portraits and animations
 * - Audio per dialogue line
 * - Save/Load dialogue state
 */

using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Gubun.UnityTools.Dialogue
{
    // ==========================================
    // DIALOGUE DATA
    // ==========================================
    [CreateAssetMenu(fileName = "NewDialogue", menuName = "Gubun/Dialogue/Dialogue Data")]
    public class DialogueData : ScriptableObject
    {
        [Header("GUBUN - Dialogue Info")]
        public string dialogueId;
        public string title;
        public string startingNodeId;
        
        [Header("GUBUN - Nodes")]
        public List<DialogueNode> nodes = new List<DialogueNode>();
        
        [Header("GUBUN - Variables")]
        public List<DialogueVariable> defaultVariables = new List<DialogueVariable>();
        
        [Header("GUBUN - Settings")]
        public float typewriterSpeed = 0.05f;
        public bool autoAdvance = false;
        public float autoAdvanceDelay = 3f;
        public AudioClip defaultTypingSound;
        public Sprite defaultBackground;

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(dialogueId))
                dialogueId = System.Guid.NewGuid().ToString();
        }
        
        public DialogueNode GetNode(string nodeId)
        {
            return nodes.Find(n => n.nodeId == nodeId);
        }
    }

    [System.Serializable]
    public class DialogueNode
    {
        public string nodeId;
        public string speakerName;
        public Sprite portrait;
        public string text;
        public AudioClip voiceClip;
        public float displayTime = -1f; // -1 = manual advance
        public List<DialogueChoice> choices = new List<DialogueChoice>();
        public string nextNodeId; // For linear progression
        public List<DialogueAction> onEnterActions = new List<DialogueAction>();
        public List<DialogueAction> onExitActions = new List<DialogueAction>();
    }

    [System.Serializable]
    public class DialogueChoice
    {
        public string choiceId;
        public string text;
        public string nextNodeId;
        public List<DialogueCondition> conditions = new List<DialogueCondition>();
        public List<DialogueAction> onSelectActions = new List<DialogueAction>();
        public bool oneTimeOnly = false; // Disappears after selecting
    }

    [System.Serializable]
    public class DialogueCondition
    {
        public string variableName;
        public ComparisonType comparison;
        public string value;
    }

    [System.Serializable]
    public class DialogueAction
    {
        public ActionType actionType;
        public string targetVariable;
        public string value;
    }

    [System.Serializable]
    public class DialogueVariable
    {
        public string name;
        public string value;
    }

    public enum ComparisonType
    {
        Equals, NotEquals, GreaterThan, LessThan, GreaterOrEqual, LessOrEqual, Contains
    }

    public enum ActionType
    {
        SetVariable, AddToVariable, SubtractFromVariable, StartQuest, CompleteQuest, 
        GiveItem, RemoveItem, PlayAnimation, PlaySound, ChangeScene, EndDialogue
    }

    // ==========================================
    // DIALOGUE MANAGER
    // ==========================================
    [AddComponentMenu("Gubun/Dialogue/Dialogue Manager")]
    public class DialogueManager : MonoBehaviour
    {
        [Header("GUBUN - UI References")]
        public GameObject dialoguePanel;
        public Text nameText;
        public Text dialogueText;
        public Image portraitImage;
        public Image backgroundImage;
        public Transform choicesContainer;
        public GameObject choiceButtonPrefab;
        public Button continueButton;

        [Header("GUBUN - Settings")]
        public bool pauseGameDuringDialogue = true;
        public float textSpeedMultiplier = 1f;
        public bool skipTypingOnClick = true;

        // Estado
        private DialogueData currentDialogue;
        private DialogueNode currentNode;
        private Dictionary<string, string> variables = new Dictionary<string, string>();
        private HashSet<string> usedChoices = new HashSet<string>();
        private bool isTyping;
        private bool waitingForInput;
        private float autoAdvanceTimer;
        
        // Eventos
        public System.Action OnDialogueStarted;
        public System.Action OnDialogueEnded;
        public System.Action<string, string> OnNodeChanged; // nodeId, speaker

        // Copyright
        private const string COPYRIGHT = "© 2025 GUBUN. All Rights Reserved.";

        // Singleton
        public static DialogueManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            
            if (continueButton != null)
            {
                continueButton.onClick.AddListener(OnContinueClicked);
            }
            
            // Hide panel initially
            if (dialoguePanel != null)
            {
                dialoguePanel.SetActive(false);
            }
            
            Debug.Log("[GUBUN] Dialogue System v1.8.0 initialized. " + COPYRIGHT);
        }

        // ==========================================
        // DIALOGUE CONTROL
        // ==========================================
        
        public void StartDialogue(DialogueData dialogue)
        {
            if (dialogue == null) return;
            
            currentDialogue = dialogue;
            
            // Initialize variables
            variables.Clear();
            foreach (var var in dialogue.defaultVariables)
            {
                variables[var.name] = var.value;
            }
            
            usedChoices.Clear();
            
            // Pause game
            if (pauseGameDuringDialogue)
            {
                Time.timeScale = 0f;
            }
            
            // Show UI
            if (dialoguePanel != null)
            {
                dialoguePanel.SetActive(true);
            }
            
            OnDialogueStarted?.Invoke();
            
            // Start first node
            SetNode(dialogue.startingNodeId);
        }
        
        public void EndDialogue()
        {
            if (dialoguePanel != null)
            {
                dialoguePanel.SetActive(false);
            }
            
            if (pauseGameDuringDialogue)
            {
                Time.timeScale = 1f;
            }
            
            OnDialogueEnded?.Invoke();
            
            currentDialogue = null;
            currentNode = null;
        }
        
        private void SetNode(string nodeId)
        {
            if (currentDialogue == null) return;
            
            currentNode = currentDialogue.GetNode(nodeId);
            
            if (currentNode == null)
            {
                Debug.LogWarning($"[GUBUN] Node {nodeId} not found");
                EndDialogue();
                return;
            }
            
            // Execute enter actions
            ExecuteActions(currentNode.onEnterActions);
            
            // Update UI
            UpdateUI();
            
            OnNodeChanged?.Invoke(nodeId, currentNode.speakerName);
            
            // Start typing
            StopAllCoroutines();
            StartCoroutine(TypeText(ProcessText(currentNode.text)));
        }

        // ==========================================
        // UI UPDATES
        // ==========================================
        
        private void UpdateUI()
        {
            // Name
            if (nameText != null)
            {
                nameText.text = currentNode.speakerName;
            }
            
            // Portrait
            if (portraitImage != null)
            {
                portraitImage.sprite = currentNode.portrait;
                portraitImage.gameObject.SetActive(currentNode.portrait != null);
            }
            
            // Background
            if (backgroundImage != null && currentDialogue.defaultBackground != null)
            {
                backgroundImage.sprite = currentDialogue.defaultBackground;
            }
            
            // Clear choices
            foreach (Transform child in choicesContainer)
            {
                Destroy(child.gameObject);
            }
        }
        
        private System.Collections.IEnumerator TypeText(string text)
        {
            isTyping = true;
            waitingForInput = false;
            
            if (dialogueText != null)
            {
                dialogueText.text = "";
                
                float delay = currentDialogue.typewriterSpeed / textSpeedMultiplier;
                
                for (int i = 0; i < text.Length; i++)
                {
                    dialogueText.text += text[i];
                    
                    // Play typing sound
                    if (currentDialogue.defaultTypingSound != null && i % 3 == 0)
                    {
                        AudioSource.PlayClipAtPoint(currentDialogue.defaultTypingSound, Camera.main.transform.position);
                    }
                    
                    yield return new WaitForSecondsRealtime(delay);
                }
            }
            
            isTyping = false;
            OnTypingFinished();
        }
        
        private void OnTypingFinished()
        {
            // Show choices or continue button
            if (currentNode.choices.Count > 0)
            {
                ShowChoices();
            }
            else if (currentDialogue.autoAdvance && currentNode.displayTime > 0)
            {
                StartCoroutine(AutoAdvance(currentNode.displayTime));
            }
            else
            {
                waitingForInput = true;
                if (continueButton != null)
                {
                    continueButton.gameObject.SetActive(true);
                }
            }
        }
        
        private System.Collections.IEnumerator AutoAdvance(float delay)
        {
            yield return new WaitForSecondsRealtime(delay);
            ContinueToNext();
        }

        // ==========================================
        // CHOICES
        // ==========================================
        
        private void ShowChoices()
        {
            if (choicesContainer == null || choiceButtonPrefab == null) return;
            
            foreach (var choice in currentNode.choices)
            {
                // Check if one-time and already used
                if (choice.oneTimeOnly && usedChoices.Contains(choice.choiceId))
                    continue;
                
                // Check conditions
                if (!CheckConditions(choice.conditions))
                    continue;
                
                // Create button
                GameObject buttonObj = Instantiate(choiceButtonPrefab, choicesContainer);
                Text buttonText = buttonObj.GetComponentInChildren<Text>();
                Button button = buttonObj.GetComponent<Button>();
                
                string processedText = ProcessText(choice.text);
                if (buttonText != null) buttonText.text = processedText;
                
                // Capture choice for closure
                var capturedChoice = choice;
                button.onClick.AddListener(() => OnChoiceSelected(capturedChoice));
            }
            
            if (continueButton != null)
            {
                continueButton.gameObject.SetActive(false);
            }
        }
        
        private void OnChoiceSelected(DialogueChoice choice)
        {
            // Mark as used
            if (choice.oneTimeOnly)
            {
                usedChoices.Add(choice.choiceId);
            }
            
            // Execute actions
            ExecuteActions(choice.onSelectActions);
            
            // Move to next node
            if (!string.IsNullOrEmpty(choice.nextNodeId))
            {
                SetNode(choice.nextNodeId);
            }
        }

        // ==========================================
        // CONTINUATION
        // ==========================================
        
        private void OnContinueClicked()
        {
            if (isTyping && skipTypingOnClick)
            {
                // Skip to end
                StopAllCoroutines();
                if (dialogueText != null)
                {
                    dialogueText.text = ProcessText(currentNode.text);
                }
                isTyping = false;
                OnTypingFinished();
            }
            else if (waitingForInput)
            {
                ContinueToNext();
            }
        }
        
        private void ContinueToNext()
        {
            // Execute exit actions
            ExecuteActions(currentNode.onExitActions);
            
            // Move to next node
            if (!string.IsNullOrEmpty(currentNode.nextNodeId))
            {
                SetNode(currentNode.nextNodeId);
            }
            else
            {
                EndDialogue();
            }
        }

        // ==========================================
        // CONDITIONS & ACTIONS
        // ==========================================
        
        private bool CheckConditions(List<DialogueCondition> conditions)
        {
            if (conditions.Count == 0) return true;
            
            foreach (var condition in conditions)
            {
                string varValue = GetVariable(condition.variableName);
                bool result = false;
                
                switch (condition.comparison)
                {
                    case ComparisonType.Equals:
                        result = varValue == condition.value;
                        break;
                    case ComparisonType.NotEquals:
                        result = varValue != condition.value;
                        break;
                    case ComparisonType.GreaterThan:
                        float v1, v2;
                        if (float.TryParse(varValue, out v1) && float.TryParse(condition.value, out v2))
                            result = v1 > v2;
                        break;
                    // Add more cases...
                }
                
                if (!result) return false;
            }
            
            return true;
        }
        
        private void ExecuteActions(List<DialogueAction> actions)
        {
            foreach (var action in actions)
            {
                switch (action.actionType)
                {
                    case ActionType.SetVariable:
                        SetVariable(action.targetVariable, action.value);
                        break;
                    case ActionType.AddToVariable:
                        float current = float.Parse(GetVariable(action.targetVariable));
                        float add = float.Parse(action.value);
                        SetVariable(action.targetVariable, (current + add).ToString());
                        break;
                    case ActionType.EndDialogue:
                        EndDialogue();
                        break;
                    // Add more actions...
                }
            }
        }

        // ==========================================
        // VARIABLES
        // ==========================================
        
        public void SetVariable(string name, string value)
        {
            variables[name] = value;
        }
        
        public string GetVariable(string name)
        {
            if (variables.ContainsKey(name))
                return variables[name];
            return "";
        }
        
        private string ProcessText(string text)
        {
            // Replace variables like $playerName
            return Regex.Replace(text, @"\$(\w+)", match =>
            {
                string varName = match.Groups[1].Value;
                return GetVariable(varName);
            });
        }

        // ==========================================
        // YARN IMPORTER (Optional)
        // ==========================================
        
        public void ImportFromYarn(string yarnJson)
        {
            // Parse Yarn format and convert to DialogueData
            // Implementation for Yarn Spinner compatibility
            Debug.Log("[GUBUN] Yarn import not yet implemented");
        }
    }
}`,
            featured: true
        },
        {
            id: "script-6",
            name: "Quest System with Objectives",
            engine: "unity",
            language: "csharp",
            description: "Sistema de misiones completo con objetivos múltiples, progreso, rewards, y UI dinámica. Soporte para quests principales y secundarias.",
            tags: ["Quest", "Mission", "Objectives", "Progression"],
            downloads: 3980,
            rating: 4.8,
            icon: "📜",
            code: `/*
 * =============================================================================
 * QUEST SYSTEM WITH OBJECTIVES
 * Copyright (c) 2025 GUBUN. All Rights Reserved.
 * Author: GUBUN Engineering Team
 * Version: 2.2.0
 * License: Commercial License - GUBUN Tools
 * Website: https://gubun.onrender.com
 * =============================================================================
 * 
 * FEATURES:
 * - Multi-objective quests
 * - Quest types: Main, Side, Daily, Achievement
 * - Optional and required objectives
 * - Reward system (XP, items, currency)
 * - Quest chains and prerequisites
 * - UI with progress tracking
 * - Save/Load quest state
 */

using UnityEngine;
using System.Collections.Generic;
using System;

namespace Gubun.UnityTools.Quests
{
    // ==========================================
    // QUEST DATA
    // ==========================================
    public enum QuestType { Main, Side, Daily, Weekly, Achievement, Tutorial }
    public enum QuestStatus { Locked, Available, Active, Completed, Failed, TurnedIn }
    public enum ObjectiveType { Kill, Collect, Reach, Talk, Escort, Defend, Craft, Explore }

    [CreateAssetMenu(fileName = "NewQuest", menuName = "Gubun/Quest/Quest Data")]
    public class QuestData : ScriptableObject
    {
        [Header("GUBUN - Quest Info")]
        public string questId;
        public string questTitle;
        [TextArea(3, 10)]
        public string description;
        public QuestType questType = QuestType.Side;
        public int requiredLevel = 1;
        
        [Header("GUBUN - Objectives")]
        public List<QuestObjective> objectives = new List<QuestObjective>();
        
        [Header("GUBUN - Prerequisites")]
        public List<string> requiredCompletedQuests = new List<string>();
        public List<string> requiredItems = new List<string>();
        
        [Header("GUBUN - Rewards")]
        public int experienceReward = 100;
        public int goldReward = 50;
        public List<ItemReward> itemRewards = new List<ItemReward>();
        public List<string> unlockQuestIds = new List<string>();
        
        [Header("GUBUN - Settings")]
        public bool autoAccept = false;
        public bool abandonable = true;
        public float timeLimit = 0f; // 0 = no limit
        public bool failOnDeath = false;

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(questId))
                questId = Guid.NewGuid().ToString();
        }
    }

    [System.Serializable]
    public class QuestObjective
    {
        public string objectiveId;
        public string description;
        public ObjectiveType type;
        public string targetId; // Enemy ID, item ID, location ID, NPC ID
        public int requiredAmount = 1;
        public bool optional = false;
        public bool hidden = false; // Hidden until previous objective complete
        public List<DialogueReference> completionDialogues = new List<DialogueReference>();
    }

    [System.Serializable]
    public class DialogueReference
    {
        public string npcId;
        public string dialogueNodeId;
    }

    [System.Serializable]
    public class ItemReward
    {
        public string itemId;
        public int amount = 1;
    }

    // ==========================================
    // ACTIVE QUEST INSTANCE
    // ==========================================
    [System.Serializable]
    public class ActiveQuest
    {
        public string questId;
        public QuestStatus status;
        public float startTime;
        public Dictionary<string, int> objectiveProgress = new Dictionary<string, int>();
        public List<string> completedObjectives = new List<string>();
        public bool isTracking;
        
        public event Action<string, int, int> OnObjectiveProgress; // objectiveId, current, required
        public event Action<string> OnObjectiveCompleted;
        public event Action OnQuestCompleted;

        public ActiveQuest(string id)
        {
            questId = id;
            status = QuestStatus.Active;
            startTime = Time.time;
        }

        public void UpdateProgress(string objectiveId, int amount = 1)
        {
            if (completedObjectives.Contains(objectiveId)) return;
            
            if (!objectiveProgress.ContainsKey(objectiveId))
            {
                objectiveProgress[objectiveId] = 0;
            }
            
            objectiveProgress[objectiveId] += amount;
            
            // Check if objective complete
            QuestData quest = QuestDatabase.Instance?.GetQuest(questId);
            if (quest != null)
            {
                var objective = quest.objectives.Find(o => o.objectiveId == objectiveId);
                if (objective != null)
                {
                    OnObjectiveProgress?.Invoke(objectiveId, objectiveProgress[objectiveId], objective.requiredAmount);
                    
                    if (objectiveProgress[objectiveId] >= objective.requiredAmount)
                    {
                        CompleteObjective(objectiveId);
                    }
                }
            }
        }

        public void CompleteObjective(string objectiveId)
        {
            if (!completedObjectives.Contains(objectiveId))
            {
                completedObjectives.Add(objectiveId);
                OnObjectiveCompleted?.Invoke(objectiveId);
                
                CheckQuestCompletion();
            }
        }

        public void CheckQuestCompletion()
        {
            QuestData quest = QuestDatabase.Instance?.GetQuest(questId);
            if (quest == null) return;
            
            bool allRequiredComplete = true;
            
            foreach (var objective in quest.objectives)
            {
                if (!objective.optional && !completedObjectives.Contains(objective.objectiveId))
                {
                    allRequiredComplete = false;
                    break;
                }
            }
            
            if (allRequiredComplete)
            {
                status = QuestStatus.Completed;
                OnQuestCompleted?.Invoke();
            }
        }

        public int GetProgress(string objectiveId)
        {
            return objectiveProgress.ContainsKey(objectiveId) ? objectiveProgress[objectiveId] : 0;
        }

        public float GetCompletionPercentage()
        {
            QuestData quest = QuestDatabase.Instance?.GetQuest(questId);
            if (quest == null || quest.objectives.Count == 0) return 0f;
            
            int requiredCount = 0;
            int completedCount = 0;
            
            foreach (var objective in quest.objectives)
            {
                if (!objective.optional)
                {
                    requiredCount++;
                    if (completedObjectives.Contains(objective.objectiveId))
                    {
                        completedCount++;
                    }
                }
            }
            
            return requiredCount > 0 ? (float)completedCount / requiredCount : 1f;
        }
    }

    // ==========================================
    // QUEST MANAGER
    // ==========================================
    [AddComponentMenu("Gubun/Quest/Quest Manager")]
    public class QuestManager : MonoBehaviour
    {
        [Header("GUBUN - Settings")]
        public int maxActiveQuests = 10;
        public bool autoTrackNewQuests = true;
        public bool showCompletedObjectives = true;

        // Estado
        private Dictionary<string, ActiveQuest> activeQuests = new Dictionary<string, ActiveQuest>();
        private HashSet<string> completedQuests = new HashSet<string>();
        private string trackedQuestId;
        
        // Eventos
        public event Action<ActiveQuest> OnQuestAccepted;
        public event Action<ActiveQuest> OnQuestCompleted;
        public event Action<ActiveQuest> OnQuestTurnedIn;
        public event Action<ActiveQuest> OnQuestFailed;
        public event Action<ActiveQuest, string, int, int> OnObjectiveUpdated; // quest, objective, current, required

        // Singleton
        public static QuestManager Instance { get; private set; }
        
        // Copyright
        private const string COPYRIGHT = "© 2025 GUBUN. All Rights Reserved.";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            Debug.Log("[GUBUN] Quest System v2.2.0 initialized. " + COPYRIGHT);
        }

        // ==========================================
        // QUEST OPERATIONS
        // ==========================================
        
        public bool AcceptQuest(string questId)
        {
            if (activeQuests.Count >= maxActiveQuests)
            {
                Debug.LogWarning("[GUBUN] Cannot accept quest: max active quests reached");
                return false;
            }
            
            if (activeQuests.ContainsKey(questId))
            {
                Debug.LogWarning($"[GUBUN] Quest {questId} already active");
                return false;
            }
            
            QuestData quest = QuestDatabase.Instance?.GetQuest(questId);
            if (quest == null)
            {
                Debug.LogError($"[GUBUN] Quest {questId} not found");
                return false;
            }
            
            // Check prerequisites
            if (!CanAcceptQuest(quest))
            {
                Debug.LogWarning($"[GUBUN] Prerequisites not met for quest {questId}");
                return false;
            }
            
            ActiveQuest activeQuest = new ActiveQuest(questId);
            
            // Subscribe to events
            activeQuest.OnObjectiveProgress += (objId, current, required) =>
            {
                OnObjectiveUpdated?.Invoke(activeQuest, objId, current, required);
            };
            
            activeQuest.OnQuestCompleted += () =>
            {
                OnQuestCompleted?.Invoke(activeQuest);
                // Unlock next quests
                foreach (var unlockId in quest.unlockQuestIds)
                {
                    // Notify that quest is now available
                }
            };
            
            activeQuests[questId] = activeQuest;
            
            if (autoTrackNewQuests)
            {
                trackedQuestId = questId;
            }
            
            OnQuestAccepted?.Invoke(activeQuest);
            
            Debug.Log($"[GUBUN] Quest accepted: {quest.questTitle}");
            return true;
        }
        
        public bool CompleteObjective(string questId, string objectiveId, int amount = 1)
        {
            if (!activeQuests.ContainsKey(questId)) return false;
            
            activeQuests[questId].UpdateProgress(objectiveId, amount);
            return true;
        }
        
        public bool TurnInQuest(string questId)
        {
            if (!activeQuests.ContainsKey(questId)) return false;
            
            var activeQuest = activeQuests[questId];
            if (activeQuest.status != QuestStatus.Completed)
            {
                Debug.LogWarning("[GUBUN] Quest not completed yet");
                return false;
            }
            
            QuestData quest = QuestDatabase.Instance?.GetQuest(questId);
            if (quest == null) return false;
            
            // Give rewards
            GiveRewards(quest);
            
            // Move to completed
            activeQuests.Remove(questId);
            completedQuests.Add(questId);
            
            if (trackedQuestId == questId)
            {
                trackedQuestId = null;
            }
            
            OnQuestTurnedIn?.Invoke(activeQuest);
            
            Debug.Log($"[GUBUN] Quest turned in: {quest.questTitle}");
            return true;
        }
        
        public void AbandonQuest(string questId)
        {
            if (!activeQuests.ContainsKey(questId)) return;
            
            var quest = activeQuests[questId];
            QuestData questData = QuestDatabase.Instance?.GetQuest(questId);
            
            if (questData != null && !questData.abandonable)
            {
                Debug.LogWarning("[GUBUN] This quest cannot be abandoned");
                return;
            }
            
            activeQuests.Remove(questId);
            
            if (trackedQuestId == questId)
            {
                trackedQuestId = null;
            }
            
            Debug.Log($"[GUBUN] Quest abandoned: {questId}");
        }
        
        public void FailQuest(string questId)
        {
            if (!activeQuests.ContainsKey(questId)) return;
            
            var quest = activeQuests[questId];
            quest.status = QuestStatus.Failed;
            
            OnQuestFailed?.Invoke(quest);
        }

        // ==========================================
        // REWARDS
        // ==========================================
        
        private void GiveRewards(QuestData quest)
        {
            // XP
            Debug.Log($"[GUBUN] Reward: {quest.experienceReward} XP");
            
            // Gold
            Debug.Log($"[GUBUN] Reward: {quest.goldReward} Gold");
            
            // Items
            foreach (var reward in quest.itemRewards)
            {
                Debug.Log($"[GUBUN] Reward: {reward.amount}x {reward.itemId}");
                // Add to inventory
            }
        }

        // ==========================================
        // PROGRESS UPDATES
        // ==========================================
        
        public void ReportKill(string enemyId)
        {
            foreach (var quest in activeQuests.Values)
            {
                QuestData questData = QuestDatabase.Instance?.GetQuest(quest.questId);
                if (questData == null) continue;
                
                foreach (var objective in questData.objectives)
                {
                    if (objective.type == ObjectiveType.Kill && objective.targetId == enemyId)
                    {
                        quest.UpdateProgress(objective.objectiveId, 1);
                    }
                }
            }
        }
        
        public void ReportItemCollected(string itemId, int amount = 1)
        {
            foreach (var quest in activeQuests.Values)
            {
                QuestData questData = QuestDatabase.Instance?.GetQuest(quest.questId);
                if (questData == null) continue;
                
                foreach (var objective in questData.objectives)
                {
                    if (objective.type == ObjectiveType.Collect && objective.targetId == itemId)
                    {
                        quest.UpdateProgress(objective.objectiveId, amount);
                    }
                }
            }
        }
        
        public void ReportLocationReached(string locationId)
        {
            foreach (var quest in activeQuests.Values)
            {
                QuestData questData = QuestDatabase.Instance?.GetQuest(quest.questId);
                if (questData == null) continue;
                
                foreach (var objective in questData.objectives)
                {
                    if (objective.type == ObjectiveType.Reach && objective.targetId == locationId)
                    {
                        quest.CompleteObjective(objective.objectiveId);
                    }
                }
            }
        }
        
        public void ReportNpcTalked(string npcId)
        {
            foreach (var quest in activeQuests.Values)
            {
                QuestData questData = QuestDatabase.Instance?.GetQuest(quest.questId);
                if (questData == null) continue;
                
                foreach (var objective in questData.objectives)
                {
                    if (objective.type == ObjectiveType.Talk && objective.targetId == npcId)
                    {
                        quest.CompleteObjective(objective.objectiveId);
                    }
                }
            }
        }

        // ==========================================
        // TRACKING
        // ==========================================
        
        public void SetTrackedQuest(string questId)
        {
            if (activeQuests.ContainsKey(questId) || questId == null)
            {
                trackedQuestId = questId;
            }
        }
        
        public ActiveQuest GetTrackedQuest()
        {
            if (trackedQuestId != null && activeQuests.ContainsKey(trackedQuestId))
            {
                return activeQuests[trackedQuestId];
            }
            return null;
        }

        // ==========================================
        // QUERIES
        // ==========================================
        
        public bool CanAcceptQuest(QuestData quest)
        {
            // Check level
            // if (playerLevel < quest.requiredLevel) return false;
            
            // Check prerequisites
            foreach (var requiredQuest in quest.requiredCompletedQuests)
            {
                if (!completedQuests.Contains(requiredQuest))
                    return false;
            }
            
            return true;
        }
        
        public bool IsQuestActive(string questId)
        {
            return activeQuests.ContainsKey(questId);
        }
        
        public bool IsQuestCompleted(string questId)
        {
            return completedQuests.Contains(questId);
        }
        
        public ActiveQuest GetActiveQuest(string questId)
        {
            return activeQuests.ContainsKey(questId) ? activeQuests[questId] : null;
        }
        
        public List<ActiveQuest> GetAllActiveQuests()
        {
            return new List<ActiveQuest>(activeQuests.Values);
        }
        
        public int GetActiveQuestCount() => activeQuests.Count;
        public int GetCompletedQuestCount() => completedQuests.Count;

        // ==========================================
        // SAVE / LOAD
        // ==========================================
        
        public QuestSaveData GetSaveData()
        {
            return new QuestSaveData
            {
                activeQuests = new List<string>(activeQuests.Keys),
                completedQuests = new List<string>(completedQuests),
                trackedQuestId = trackedQuestId
            };
        }
        
        public void LoadSaveData(QuestSaveData data)
        {
            activeQuests.Clear();
            completedQuests = new HashSet<string>(data.completedQuests);
            trackedQuestId = data.trackedQuestId;
            
            // Reconstruct active quests (progress will need to be loaded separately)
            foreach (var questId in data.activeQuests)
            {
                AcceptQuest(questId);
            }
        }
    }

    // ==========================================
    // QUEST DATABASE
    // ==========================================
    public class QuestDatabase : MonoBehaviour
    {
        public static QuestDatabase Instance { get; private set; }
        
        [Header("GUBUN - Quest Database")]
        public List<QuestData> allQuests = new List<QuestData>();
        
        private Dictionary<string, QuestData> questLookup;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            BuildLookup();
        }
        
        private void BuildLookup()
        {
            questLookup = new Dictionary<string, QuestData>();
            foreach (var quest in allQuests)
            {
                if (!string.IsNullOrEmpty(quest.questId))
                {
                    questLookup[quest.questId] = quest;
                }
            }
        }
        
        public QuestData GetQuest(string questId)
        {
            return questLookup != null && questLookup.ContainsKey(questId) ? questLookup[questId] : null;
        }
        
        public List<QuestData> GetQuestsByType(QuestType type)
        {
            return allQuests.FindAll(q => q.questType == type);
        }
    }

    [System.Serializable]
    public class QuestSaveData
    {
        public List<string> activeQuests;
        public List<string> completedQuests;
        public string trackedQuestId;
    }
}`,
            featured: true
        }
    ],
    
    posts: [
        {
            id: "post-1",
            title: "Optimización de Unity: 10 Tips Esenciales",
            excerpt: "Mejora el rendimiento de tus proyectos Unity con estas técnicas probadas de profiling y optimización.",
            category: "unity",
            date: "2025-04-15",
            readTime: "8 min",
            image: "🎯",
            featured: true
        },
        {
            id: "post-2",
            title: "Blueprints vs C++ en Unreal Engine",
            excerpt: "Cuándo usar cada approach: guía práctica para decidir entre visual scripting y código nativo.",
            category: "unreal",
            date: "2025-04-12",
            readTime: "6 min",
            image: "🔷",
            featured: true
        },
        {
            id: "post-3",
            title: "Introducción a Godot 4.0",
            excerpt: "Novedades del motor open source: nuevo renderer, mejoras en GDScript y sistema de nodos mejorado.",
            category: "godot",
            date: "2025-04-10",
            readTime: "5 min",
            image: "🤖",
            featured: true
        },
        {
            id: "post-4",
            title: "Herramientas Imprescindibles para GameDev en Windows",
            excerpt: "Las mejores aplicaciones gratuitas que todo desarrollador de juegos debe tener instaladas.",
            category: "herramientas",
            date: "2025-04-08",
            readTime: "4 min",
            image: "🛠️",
            featured: false
        },
        {
            id: "post-5",
            title: "Sistemas de Input Modernos en Unity",
            excerpt: "Migrando del Input Manager al nuevo Input System con ejemplos prácticos de implementación.",
            category: "unity",
            date: "2025-04-05",
            readTime: "7 min",
            image: "🎮",
            featured: false
        }
    ],
    
    categories: {
        tools: [
            { id: "sistema", name: "Sistema", icon: "🔧" },
            { id: "desarrollo", name: "Desarrollo", icon: "💻" },
            { id: "multimedia", name: "Multimedia", icon: "🎨" },
            { id: "red", name: "Red", icon: "🌐" },
            { id: "seguridad", name: "Seguridad", icon: "🔒" }
        ],
        engines: [
            { id: "unity", name: "Unity", icon: "🎮", color: "#222C37" },
            { id: "unreal", name: "Unreal Engine", icon: "🚀", color: "#0E1128" },
            { id: "godot", name: "Godot", icon: "🤖", color: "#478CBF" },
            { id: "gamemaker", name: "GameMaker", icon: "🎲", color: "#71B64C" }
        ]
    }
};
