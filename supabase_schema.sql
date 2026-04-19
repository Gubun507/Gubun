-- Supabase Schema for Gubun
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    icon TEXT DEFAULT '🔧',
    link TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    engine TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    icon TEXT DEFAULT '📜',
    code TEXT NOT NULL,
    featured BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads tracking table
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool', 'script')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views tracking table (with deduplication)
CREATE TABLE IF NOT EXISTS views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool', 'script')),
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool', 'script')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_created ON tools(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scripts_engine ON scripts(engine);
CREATE INDEX IF NOT EXISTS idx_scripts_language ON scripts(language);
CREATE INDEX IF NOT EXISTS idx_scripts_featured ON scripts(featured);
CREATE INDEX IF NOT EXISTS idx_scripts_created ON scripts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_downloads_item ON downloads(item_id, type);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at);

CREATE INDEX IF NOT EXISTS idx_views_item_ip ON views(item_id, type, ip_hash);
CREATE INDEX IF NOT EXISTS idx_views_created ON views(created_at);

CREATE INDEX IF NOT EXISTS idx_likes_item ON likes(item_id, type);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tools: Anyone can read, only authenticated can create/update (admin later)
CREATE POLICY "Tools are viewable by everyone" ON tools
    FOR SELECT USING (true);

CREATE POLICY "Tools can be created by authenticated users" ON tools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Scripts: Anyone can read
CREATE POLICY "Scripts are viewable by everyone" ON scripts
    FOR SELECT USING (true);

CREATE POLICY "Scripts can be created by authenticated users" ON scripts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Downloads: Users can view own, insert own
CREATE POLICY "Downloads are viewable by everyone" ON downloads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert downloads" ON downloads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR ip_hash IS NOT NULL);

-- Views: Insert only
CREATE POLICY "Views are viewable by everyone" ON views
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert views" ON views
    FOR INSERT WITH CHECK (true);

-- Likes: Users manage own likes
CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for counts
CREATE OR REPLACE FUNCTION get_tool_stats(tool_uuid UUID)
RETURNS TABLE(downloads BIGINT, views BIGINT, likes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM downloads WHERE item_id = tool_uuid AND type = 'tool'),
        (SELECT COUNT(*) FROM views WHERE item_id = tool_uuid AND type = 'tool'),
        (SELECT COUNT(*) FROM likes WHERE item_id = tool_uuid AND type = 'tool');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_script_stats(script_uuid UUID)
RETURNS TABLE(downloads BIGINT, views BIGINT, likes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM downloads WHERE item_id = script_uuid AND type = 'script'),
        (SELECT COUNT(*) FROM views WHERE item_id = script_uuid AND type = 'script'),
        (SELECT COUNT(*) FROM likes WHERE item_id = script_uuid AND type = 'script');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data
INSERT INTO tools (name, category, description, tags, icon, link, featured) VALUES
('PowerToys', 'sistema', 'Conjunto de utilidades para usuarios avanzados de Windows. Incluye FancyZones, PowerRename, Color Picker y más.', ARRAY['Microsoft', 'Productividad', 'Gratis'], '🧰', 'https://github.com/microsoft/PowerToys', true),
('Windows Terminal', 'desarrollo', 'Terminal moderna con pestañas, paneles divididos, aceleración GPU y soporte para múltiples shells.', ARRAY['Microsoft', 'Terminal', 'Gratis'], '💻', 'https://github.com/microsoft/terminal', true),
('ShareX', 'multimedia', 'Captura de pantalla avanzada con anotaciones, editor integrado y múltiples destinos de subida.', ARRAY['Captura', 'Open Source', 'Gratis'], '📸', 'https://getsharex.com/', true),
('7-Zip', 'sistema', 'Compresión de archivos con alta ratio y soporte para múltiples formatos incluyendo ZIP, RAR, TAR.', ARRAY['Compresión', 'Open Source', 'Gratis'], '📦', 'https://www.7-zip.org/', false),
('VS Code', 'desarrollo', 'Editor de código ligero pero poderoso con IntelliSense, debugging integrado y miles de extensiones.', ARRAY['Microsoft', 'Editor', 'Gratis'], '📝', 'https://code.visualstudio.com/', false),
('OBS Studio', 'multimedia', 'Software de streaming y grabación de video profesional con múltiples fuentes y escenas.', ARRAY['Streaming', 'Open Source', 'Gratis'], '🎥', 'https://obsproject.com/', false);

INSERT INTO scripts (name, engine, language, description, tags, icon, code, featured) VALUES
('Player Controller 2D', 'unity', 'csharp', 'Controlador de personaje 2D completo con movimiento, salto, dash y sistema de coyote time.', ARRAY['2D', 'Plataformas', 'Física'], '🏃', 'using UnityEngine;

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
}', true),
('Third Person Camera', 'unity', 'csharp', 'Cámara en tercera persona con follow suave, rotación orbita y zoom con scroll.', ARRAY['Cámara', '3D', 'Input'], '📹', 'using UnityEngine;

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
}', true),
('Health System', 'unreal', 'cpp', 'Sistema de salud replicable para multiplayer con eventos de daño y curación.', ARRAY['Gameplay', 'Multiplayer', 'Sistema'], '❤️', 'UCLASS()
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
};', true),
('Inventory System', 'unity', 'csharp', 'Sistema de inventario con slots, stack de items, drag & drop y persistencia.', ARRAY['UI', 'Sistema', 'Datos'], '🎒', '[System.Serializable]
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
}', false);
