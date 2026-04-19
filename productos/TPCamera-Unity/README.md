# Gubun Third Person Camera

Cámara de tercera persona profesional para Unity con configuración WASD.

## Características

- ✅ Follow suave del personaje
- ✅ Rotación con mouse (horizontal y vertical)
- ✅ Zoom con scroll del mouse
- ✅ Detección de colisiones (evita atravesar paredes)
- ✅ Sincronización opcional con movimiento WASD
- ✅ Modo freelook (Alt para rotar sin mover personaje)
- ✅ Altura de cámara ajustable
- ✅ Límites de ángulo vertical configurables
- ✅ Gizmos para debug en Scene view

## Instalación

1. Copia la carpeta `Scripts` a tu proyecto Unity
2. Arrastra `ThirdPersonCamera.cs` a tu Main Camera
3. Asigna el `Target` (transform del jugador) en el inspector

## Configuración Rápida

### Setup Básico

```csharp
// El script busca automáticamente un objeto con tag "Player"
// O asigna manualmente en el Inspector:
public Transform target;
```

### Configuración WASD

Para que la cámara se alinee detrás del personaje cuando te mueves:

1. Añade también `CameraController.cs` a la cámara
2. En el inspector activa: `Sync With WASD = true`
3. Ajusta `Alignment Speed` (recomendado: 3-5)
4. Ajusta `Alignment Delay` (recomendado: 0.3-0.5s)

## Controles

| Acción | Input |
|--------|-------|
| Rotar cámara | Mouse |
| Zoom | Scroll del mouse |
| Freeloook (sin mover personaje) | Mantener `Alt` |
| Bloquear rotación | Mantener `Ctrl` |

## Personalización

### Inspector Settings

**Target Settings:**
- `Target`: Transform del jugador a seguir
- `Target Offset`: Altura de la cámara relativa al jugador (default: 1.6 = hombros)

**Distance:**
- `Default Distance`: Distancia inicial (default: 5)
- `Min/Max Distance`: Límites de zoom (default: 1.5 - 15)

**Rotation:**
- `Horizontal Speed`: Sensibilidad horizontal del mouse (default: 8)
- `Vertical Speed`: Sensibilidad vertical del mouse (default: 6)
- `Min/Max Vertical Angle`: Límites de inclinación (default: -40° a 80°)

**Collision:**
- `Collision Detection`: Evitar atravesar paredes
- `Camera Radius`: Tamaño de la esfera de colisión
- `Collision Layers`: Qué capas bloquean la cámara

## API C# (Programación)

```csharp
// Obtener referencia
ThirdPersonCamera cam = Camera.main.GetComponent<ThirdPersonCamera>();

// Cambiar target dinámicamente
cam.SetTarget(newPlayerTransform);

// Resetear posición
cam.ResetCamera();

// Rotar manualmente
cam.RotateHorizontal(45f);
cam.RotateVertical(-20f);

// Obtener ángulo actual (útil para movimiento relativo a cámara)
float cameraAngle = cam.GetHorizontalAngle();
```

## Ejemplo de uso con movimiento WASD

```csharp
public class PlayerMovement : MonoBehaviour
{
    public float speed = 5f;
    private ThirdPersonCamera cam;
    
    void Start()
    {
        cam = Camera.main.GetComponent<ThirdPersonCamera>();
    }
    
    void Update()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");
        
        // Movimiento relativo a la cámara
        Vector3 forward = Quaternion.Euler(0, cam.GetHorizontalAngle(), 0) * Vector3.forward;
        Vector3 right = Quaternion.Euler(0, cam.GetHorizontalAngle(), 0) * Vector3.right;
        
        Vector3 movement = (forward * vertical + right * horizontal).normalized;
        transform.position += movement * speed * Time.deltaTime;
    }
}
```

## Requisitos

- Unity 2020.3 LTS o superior
- Built-in Render Pipeline (funciona con URP/HDRP también)

## Soporte

- [Documentación completa](https://gubun.onrender.com/)
- [Reportar issues](https://github.com/Gubun507/Gubun/issues)

---
**Gubun Tools** - Scripts profesionales para Unity
