const GUBUN_DATA = {
    tools: [
        {
            id: "tool-1",
            name: "PowerToys",
            category: "sistema",
            description: "Conjunto de utilidades para usuarios avanzados de Windows. Incluye FancyZones, PowerRename, Color Picker y más.",
            tags: ["Microsoft", "Productividad", "Gratis"],
            downloads: 15420,
            rating: 4.8,
            icon: "🧰",
            link: "https://github.com/microsoft/PowerToys",
            featured: true
        },
        {
            id: "tool-2",
            name: "Windows Terminal",
            category: "desarrollo",
            description: "Terminal moderna con pestañas, paneles divididos, aceleración GPU y soporte para múltiples shells.",
            tags: ["Microsoft", "Terminal", "Gratis"],
            downloads: 8930,
            rating: 4.7,
            icon: "💻",
            link: "https://github.com/microsoft/terminal",
            featured: true
        },
        {
            id: "tool-3",
            name: "ShareX",
            category: "multimedia",
            description: "Captura de pantalla avanzada con anotaciones, editor integrado y múltiples destinos de subida.",
            tags: ["Captura", "Open Source", "Gratis"],
            downloads: 12150,
            rating: 4.9,
            icon: "📸",
            link: "https://getsharex.com/",
            featured: true
        },
        {
            id: "tool-4",
            name: "7-Zip",
            category: "sistema",
            description: "Compresión de archivos con alta ratio y soporte para múltiples formatos incluyendo ZIP, RAR, TAR.",
            tags: ["Compresión", "Open Source", "Gratis"],
            downloads: 25600,
            rating: 4.8,
            icon: "📦",
            link: "https://www.7-zip.org/",
            featured: false
        },
        {
            id: "tool-5",
            name: "VS Code",
            category: "desarrollo",
            description: "Editor de código ligero pero poderoso con IntelliSense, debugging integrado y miles de extensiones.",
            tags: ["Microsoft", "Editor", "Gratis"],
            downloads: 45200,
            rating: 4.9,
            icon: "📝",
            link: "https://code.visualstudio.com/",
            featured: false
        },
        {
            id: "tool-6",
            name: "OBS Studio",
            category: "multimedia",
            description: "Software de streaming y grabación de video profesional con múltiples fuentes y escenas.",
            tags: ["Streaming", "Open Source", "Gratis"],
            downloads: 18700,
            rating: 4.8,
            icon: "🎥",
            link: "https://obsproject.com/",
            featured: false
        },
        {
            id: "tool-7",
            name: "Notepad++",
            category: "desarrollo",
            description: "Editor de texto y código fuente con resaltado de sintaxis, macros y búsqueda avanzada.",
            tags: ["Editor", "Open Source", "Gratis"],
            downloads: 22400,
            rating: 4.6,
            icon: "📄",
            link: "https://notepad-plus-plus.org/",
            featured: false
        },
        {
            id: "tool-8",
            name: "Greenshot",
            category: "multimedia",
            description: "Herramienta ligera de captura de pantalla con anotaciones básicas y exportación rápida.",
            tags: ["Captura", "Open Source", "Gratis"],
            downloads: 9800,
            rating: 4.5,
            icon: "📷",
            link: "https://getgreenshot.org/",
            featured: false
        },
        {
            id: "tool-9",
            name: "AutoHotkey",
            category: "sistema",
            description: "Automatización de tareas con scripts personalizados para atajos de teclado y macros.",
            tags: ["Automatización", "Open Source", "Gratis"],
            downloads: 11200,
            rating: 4.7,
            icon: "⚙️",
            link: "https://www.autohotkey.com/",
            featured: false
        }
    ],
    
    scripts: [
        {
            id: "script-1",
            name: "Player Controller 2D",
            engine: "unity",
            language: "csharp",
            description: "Controlador de personaje 2D completo con movimiento, salto, dash y sistema de coyote time.",
            tags: ["2D", "Plataformas", "Física"],
            downloads: 3420,
            rating: 4.9,
            icon: "🏃",
            code: `using UnityEngine;

public class PlayerController2D : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 8f;
    public float jumpForce = 12f;
    
    private Rigidbody2D rb;
    private bool isGrounded;
    
    void Start() => rb = GetComponent<Rigidbody2D>();
    
    void Update()
    {
        float moveInput = Input.GetAxisRaw("Horizontal");
        rb.velocity = new Vector2(moveInput * moveSpeed, rb.velocity.y);
        
        if (Input.GetButtonDown("Jump") && isGrounded)
            rb.velocity = new Vector2(rb.velocity.x, jumpForce);
    }
}`,
            featured: true
        },
        {
            id: "script-2",
            name: "Third Person Camera",
            engine: "unity",
            language: "csharp",
            description: "Cámara en tercera persona con follow suave, rotación orbita y zoom con scroll.",
            tags: ["Cámara", "3D", "Input"],
            downloads: 2890,
            rating: 4.7,
            icon: "📹",
            code: `using UnityEngine;

public class ThirdPersonCamera : MonoBehaviour
{
    public Transform target;
    public float distance = 5f;
    public float height = 2f;
    public float smoothSpeed = 5f;
    
    void LateUpdate()
    {
        Vector3 targetPos = target.position + Vector3.up * height;
        Vector3 desiredPos = targetPos - target.forward * distance;
        
        transform.position = Vector3.Lerp(transform.position, desiredPos, smoothSpeed * Time.deltaTime);
        transform.LookAt(targetPos);
    }
}`,
            featured: true
        },
        {
            id: "script-3",
            name: "Health System",
            engine: "unreal",
            language: "cpp",
            description: "Sistema de salud replicable para multiplayer con eventos de daño y curación.",
            tags: ["Gameplay", "Multiplayer", "Sistema"],
            downloads: 2150,
            rating: 4.8,
            icon: "❤️",
            code: `UCLASS()
class MYGAME_API UHealthComponent : public UActorComponent
{
    GENERATED_BODY()
    
public:
    UHealthComponent();
    
    UPROPERTY(Replicated, BlueprintReadOnly)
    float CurrentHealth;
    
    UPROPERTY(EditDefaultsOnly)
    float MaxHealth = 100.f;
    
    UFUNCTION(BlueprintCallable)
    void TakeDamage(float Damage);
    
    UFUNCTION(BlueprintCallable)
    void Heal(float Amount);
};`,
            featured: true
        },
        {
            id: "script-4",
            name: "Inventory System",
            engine: "unity",
            language: "csharp",
            description: "Sistema de inventario con slots, stack de items, drag & drop y persistencia.",
            tags: ["UI", "Sistema", "Datos"],
            downloads: 4100,
            rating: 4.6,
            icon: "🎒",
            code: `[System.Serializable]
public class InventorySlot
{
    public ItemData item;
    public int quantity;
    public int maxStack = 99;
    
    public bool CanAddItem(ItemData newItem, int amount)
    {
        if (item == null) return true;
        if (item.id != newItem.id) return false;
        return quantity + amount <= maxStack;
    }
}`,
            featured: false
        },
        {
            id: "script-5",
            name: "AI Patrol",
            engine: "unreal",
            language: "blueprint",
            description: "Sistema de patrulla AI con waypoints, detección de jugador y persecución.",
            tags: ["AI", "NPC", "Comportamiento"],
            downloads: 1780,
            rating: 4.5,
            icon: "🤖",
            code: `// Blueprint structure - implement in UE5:
// 1. Create AI Controller
// 2. Add Behavior Tree with:
//    - Selector root
//    - Sequence: Detect Player -> Chase
//    - Sequence: Patrol -> Wait -> Next Waypoint
// 3. Blackboard keys: TargetActor, WaypointIndex, WaitTime`,
            featured: false
        },
        {
            id: "script-6",
            name: "Save System",
            engine: "godot",
            language: "gdscript",
            description: "Sistema de guardado con serialización JSON, encriptación opcional y autoguardado.",
            tags: ["Datos", "Persistencia", "Sistema"],
            downloads: 1560,
            rating: 4.7,
            icon: "💾",
            code: `extends Node

const SAVE_PATH = "user://savegame.json"

func save_game():
    var save_data = {
        "player_pos": {
            "x": $Player.position.x,
            "y": $Player.position.y
        },
        "health": $Player.health,
        "inventory": $Inventory.get_save_data()
    }
    
    var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    file.store_string(JSON.stringify(save_data))
    file.close()

func load_game():
    if not FileAccess.file_exists(SAVE_PATH):
        return
    
    var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
    var json = JSON.parse_string(file.get_as_text())
    file.close()
    
    $Player.position = Vector2(json.player_pos.x, json.player_pos.y)
    $Player.health = json.health`,
            featured: false
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
