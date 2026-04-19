using UnityEngine;

namespace Gubun.Tools
{
    /// <summary>
    /// Cámara de tercera persona profesional para Unity
    /// Características: Follow suave, rotación con mouse, zoom con scroll, collision detection
    /// </summary>
    [AddComponentMenu("Gubun/Camera/Third Person Camera")]
    public class ThirdPersonCamera : MonoBehaviour
    {
        [Header("Target Settings")]
        [Tooltip("El transform del jugador a seguir")]
        public Transform target;
        
        [Tooltip("Offset desde el centro del target (ej: altura de hombros)")]
        public Vector3 targetOffset = new Vector3(0, 1.6f, 0);

        [Header("Distance Settings")]
        [Tooltip("Distancia inicial de la cámara al target")]
        [Range(1f, 20f)]
        public float defaultDistance = 5f;
        
        [Tooltip("Distancia mínima permitida")]
        [Range(0.5f, 5f)]
        public float minDistance = 1.5f;
        
        [Tooltip("Distancia máxima permitida")]
        [Range(5f, 30f)]
        public float maxDistance = 15f;

        [Header("Rotation Settings")]
        [Tooltip("Velocidad de rotación horizontal (mouse X)")]
        [Range(1f, 20f)]
        public float horizontalSpeed = 8f;
        
        [Tooltip("Velocidad de rotación vertical (mouse Y)")]
        [Range(1f, 20f)]
        public float verticalSpeed = 6f;
        
        [Tooltip("Ángulo mínimo vertical (mirar hacia abajo)")]
        [Range(-90f, 0f)]
        public float minVerticalAngle = -40f;
        
        [Tooltip("Ángulo máximo vertical (mirar hacia arriba)")]
        [Range(0f, 90f)]
        public float maxVerticalAngle = 80f;

        [Header("Smoothing")]
        [Tooltip("Suavizado del movimiento de la cámara (0 = instantáneo, 1 = muy lento)")]
        [Range(0f, 1f)]
        public float smoothTime = 0.15f;

        [Header("Collision")]
        [Tooltip("Detectar colisiones con objetos entre cámara y target")]
        public bool collisionDetection = true;
        
        [Tooltip("Capas que bloquearán la cámara")]
        public LayerMask collisionLayers = ~0; // Todas las capas
        
        [Tooltip("Radio de la esfera de colisión de la cámara")]
        [Range(0.1f, 1f)]
        public float cameraRadius = 0.3f;

        [Header("Input")]
        [Tooltip("Activar/desactivar rotación con mouse")]
        public bool mouseRotation = true;
        
        [Tooltip("Invertir eje Y")]
        public bool invertY = false;

        // Variables privadas
        private float currentDistance;
        private float targetDistance;
        private float horizontalAngle;
        private float verticalAngle;
        private Vector3 currentVelocity;
        private Vector3 targetPosition;
        private bool initialized = false;

        private void Start()
        {
            InitializeCamera();
        }

        private void InitializeCamera()
        {
            if (target == null)
            {
                Debug.LogWarning("[ThirdPersonCamera] Target no asignado. Buscando Player tag...");
                GameObject player = GameObject.FindGameObjectWithTag("Player");
                if (player != null)
                {
                    target = player.transform;
                }
                else
                {
                    Debug.LogError("[ThirdPersonCamera] No se encontró target. Asigna el transform del jugador.");
                    enabled = false;
                    return;
                }
            }

            // Inicializar valores
            currentDistance = defaultDistance;
            targetDistance = defaultDistance;
            
            // Calcular ángulos actuales basados en la posición inicial
            Vector3 offset = transform.position - (target.position + targetOffset);
            horizontalAngle = Mathf.Atan2(offset.x, offset.z) * Mathf.Rad2Deg;
            verticalAngle = Mathf.Asin(offset.y / offset.magnitude) * Mathf.Rad2Deg;

            initialized = true;
        }

        private void LateUpdate()
        {
            if (!initialized || target == null) return;

            HandleInput();
            CalculateCameraPosition();
            ApplyCameraPosition();
        }

        private void HandleInput()
        {
            // Zoom con scroll del mouse
            float scrollInput = Input.GetAxis("Mouse ScrollWheel");
            if (scrollInput != 0)
            {
                targetDistance -= scrollInput * 5f;
                targetDistance = Mathf.Clamp(targetDistance, minDistance, maxDistance);
            }

            // Rotación con movimiento del mouse
            if (mouseRotation)
            {
                float mouseX = Input.GetAxis("Mouse X") * horizontalSpeed;
                float mouseY = Input.GetAxis("Mouse Y") * verticalSpeed * (invertY ? 1 : -1);

                horizontalAngle += mouseX;
                verticalAngle += mouseY;
                verticalAngle = Mathf.Clamp(verticalAngle, minVerticalAngle, maxVerticalAngle);
            }

            // WASD también puede rotar la cámara (opcional)
            // Descomenta si quieres que WASD rote la cámara alrededor del target
            /*
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");
            
            if (Mathf.Abs(horizontal) > 0.1f || Mathf.Abs(vertical) > 0.1f)
            {
                // Ajusta la cámara detrás del movimiento
                float targetAngle = Mathf.Atan2(horizontal, vertical) * Mathf.Rad2Deg + target.eulerAngles.y;
                horizontalAngle = Mathf.LerpAngle(horizontalAngle, targetAngle, Time.deltaTime * 2f);
            }
            */
        }

        private void CalculateCameraPosition()
        {
            // Suavizar la distancia
            currentDistance = Mathf.Lerp(currentDistance, targetDistance, Time.deltaTime * 10f);

            // Calcular posición deseada basada en ángulos esféricos
            float radH = horizontalAngle * Mathf.Deg2Rad;
            float radV = verticalAngle * Mathf.Deg2Rad;

            float x = Mathf.Sin(radH) * Mathf.Cos(radV) * currentDistance;
            float y = Mathf.Sin(radV) * currentDistance;
            float z = Mathf.Cos(radH) * Mathf.Cos(radV) * currentDistance;

            Vector3 desiredOffset = new Vector3(x, y, z);
            targetPosition = target.position + targetOffset + desiredOffset;

            // Detección de colisiones
            if (collisionDetection)
            {
                Vector3 targetPoint = target.position + targetOffset;
                Vector3 direction = (targetPosition - targetPoint).normalized;
                float distance = Vector3.Distance(targetPoint, targetPosition);

                // Raycast con esfera para detectar obstáculos
                if (Physics.SphereCast(targetPoint, cameraRadius, direction, out RaycastHit hit, distance, collisionLayers))
                {
                    // Colisión detectada - ajustar distancia
                    float collisionDistance = Mathf.Max(hit.distance - cameraRadius, minDistance);
                    targetPosition = targetPoint + direction * collisionDistance;
                }
            }
        }

        private void ApplyCameraPosition()
        {
            // Suavizado del movimiento
            transform.position = Vector3.SmoothDamp(
                transform.position, 
                targetPosition, 
                ref currentVelocity, 
                smoothTime
            );

            // Mirar al target
            Vector3 lookAtPoint = target.position + targetOffset;
            transform.LookAt(lookAtPoint);
        }

        // Métodos públicos para control externo
        
        /// <summary>
        /// Rota la cámara horizontalmente (para controles personalizados)
        /// </summary>
        public void RotateHorizontal(float amount)
        {
            horizontalAngle += amount;
        }

        /// <summary>
        /// Rota la cámara verticalmente (para controles personalizados)
        /// </summary>
        public void RotateVertical(float amount)
        {
            verticalAngle += amount;
            verticalAngle = Mathf.Clamp(verticalAngle, minVerticalAngle, maxVerticalAngle);
        }

        /// <summary>
        /// Cambia el target dinámicamente
        /// </summary>
        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
        }

        /// <summary>
        /// Resetea la cámara a posición default detrás del target
        /// </summary>
        public void ResetCamera()
        {
            currentDistance = defaultDistance;
            targetDistance = defaultDistance;
            verticalAngle = 20f;
            horizontalAngle = target.eulerAngles.y;
        }

        /// <summary>
        /// Obtiene el ángulo horizontal actual (útil para sincronización con movimiento del jugador)
        /// </summary>
        public float GetHorizontalAngle()
        {
            return horizontalAngle;
        }

        // Debug visualization
        private void OnDrawGizmosSelected()
        {
            if (target == null) return;

            // Dibujar línea al target
            Gizmos.color = Color.cyan;
            Gizmos.DrawLine(transform.position, target.position + targetOffset);
            
            // Dibujar esfera de colisión
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, cameraRadius);
            
            // Dibujar punto de target
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(target.position + targetOffset, 0.2f);
        }
    }
}
