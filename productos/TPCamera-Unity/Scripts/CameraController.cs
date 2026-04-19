using UnityEngine;

namespace Gubun.Tools
{
    /// <summary>
    /// Controlador adicional para la cámara que maneja input de WASD y sincronización con movimiento del jugador
    /// </summary>
    [RequireComponent(typeof(ThirdPersonCamera))]
    public class CameraController : MonoBehaviour
    {
        [Header("WASD Camera Control")]
        [Tooltip("Sincronizar rotación de cámara con movimiento WASD")]
        public bool syncWithWASD = false;
        
        [Tooltip("Velocidad de alineación de cámara con movimiento")]
        [Range(1f, 10f)]
        public float alignmentSpeed = 5f;
        
        [Tooltip("Delay antes de que la cámara se alinee con el movimiento (segundos)")]
        [Range(0f, 3f)]
        public float alignmentDelay = 0.5f;

        [Header("Freelook Mode")]
        [Tooltip("Mantener Alt para modo freelook (rotar cámara sin mover al jugador)")]
        public bool freelookWithAlt = true;
        
        [Tooltip("Tecla para bloquear rotación de cámara")]
        public KeyCode lockCameraKey = KeyCode.LeftControl;

        private ThirdPersonCamera camera;
        private float lastMovementTime;
        private bool isFreelookActive;

        private void Start()
        {
            camera = GetComponent<ThirdPersonCamera>();
            lastMovementTime = -alignmentDelay;
        }

        private void Update()
        {
            HandleWASDSync();
            HandleFreelook();
        }

        private void HandleWASDSync()
        {
            if (!syncWithWASD) return;

            // Detectar input WASD
            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");

            bool isMoving = Mathf.Abs(horizontal) > 0.1f || Mathf.Abs(vertical) > 0.1f;

            if (isMoving && !isFreelookActive)
            {
                // Calcular ángulo deseado basado en input WASD
                float targetAngle = Mathf.Atan2(horizontal, vertical) * Mathf.Rad2Deg;
                
                // Obtener rotación actual del jugador
                Transform target = camera.GetType().GetField("target", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.GetValue(camera) as Transform;
                if (target != null)
                {
                    targetAngle += target.eulerAngles.y;
                }

                // Aplicar delay antes de alinear
                if (Time.time > lastMovementTime + alignmentDelay)
                {
                    SmoothRotateToAngle(targetAngle);
                }
                
                lastMovementTime = Time.time;
            }
        }

        private void HandleFreelook()
        {
            if (!freelookWithAlt) return;

            // Activar freelook con Alt
            isFreelookActive = Input.GetKey(KeyCode.LeftAlt) || Input.GetKey(KeyCode.RightAlt);

            // Alternativamente, bloquear con Ctrl
            if (Input.GetKey(lockCameraKey))
            {
                camera.mouseRotation = false;
            }
            else
            {
                camera.mouseRotation = !isFreelookActive;
            }
        }

        private void SmoothRotateToAngle(float targetAngle)
        {
            // Acceder al ángulo horizontal privado de ThirdPersonCamera
            var field = camera.GetType().GetField("horizontalAngle", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                float currentAngle = (float)field.GetValue(camera);
                float newAngle = Mathf.LerpAngle(currentAngle, targetAngle, Time.deltaTime * alignmentSpeed);
                field.SetValue(camera, newAngle);
            }
        }

        /// <summary>
        /// Activa/desactiva sincronización WASD
        /// </summary>
        public void SetWASDSync(bool enabled)
        {
            syncWithWASD = enabled;
        }

        /// <summary>
        /// Activa modo freelook manualmente
        /// </summary>
        public void SetFreelook(bool active)
        {
            isFreelookActive = active;
        }
    }
}
