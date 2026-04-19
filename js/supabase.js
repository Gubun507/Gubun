// Supabase Configuration
const SUPABASE_URL = 'https://uwwkxwmglkuevvcmkbje.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J1ZF00zI7w89iANhinMF1Q_IkesfEOL';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Data Access Functions
const GubunDB = {
    // Tools
    async getTools(category = 'all', limit = 50) {
        let query = supabaseClient
            .from('tools')
            .select('*')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (category !== 'all') {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    
    // Scripts
    async getScripts(engine = 'all', language = 'all', limit = 50) {
        let query = supabaseClient
            .from('scripts')
            .select('*')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (engine !== 'all') {
            query = query.eq('engine', engine);
        }
        if (language !== 'all') {
            query = query.eq('language', language);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    
    // Search across tools and scripts
    async search(query) {
        const { data: tools, error: toolsError } = await supabaseClient
            .from('tools')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        
        const { data: scripts, error: scriptsError } = await supabaseClient
            .from('scripts')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        
        if (toolsError) throw toolsError;
        if (scriptsError) throw scriptsError;
        
        return {
            tools: tools || [],
            scripts: scripts || []
        };
    },
    
    // Record download with metadata
    async recordDownload(itemId, type) {
        try {
            const user = await this.getCurrentUser();
            const ipHash = await this.getIPHash();
            
            const { error } = await supabaseClient
                .from('downloads')
                .insert([{
                    item_id: itemId,
                    type: type,
                    user_id: user?.id || null,
                    ip_hash: ipHash,
                    user_agent: navigator.userAgent.slice(0, 200),
                    referrer: document.referrer.slice(0, 200) || null
                }]);
            
            if (error) {
                console.error('Error recording download:', error);
                return false;
            }
            
            return true;
        } catch (err) {
            console.error('Failed to record download:', err);
            return false;
        }
    },
    
    // Record view (with IP deduplication) - 30 min cooldown
    async recordView(itemId, type) {
        try {
            const ipHash = await this.getIPHash();
            
            // Check if view exists in last 30 minutes
            const thirtyMinutesAgo = new Date(Date.now() - 1800000).toISOString();
            const { data: existing, error: checkError } = await supabaseClient
                .from('views')
                .select('id')
                .eq('item_id', itemId)
                .eq('type', type)
                .eq('ip_hash', ipHash)
                .gte('created_at', thirtyMinutesAgo)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing view:', checkError);
            }
            
            if (!existing) {
                const { error } = await supabaseClient
                    .from('views')
                    .insert([{
                        item_id: itemId,
                        type: type,
                        ip_hash: ipHash
                    }]);
                
                if (error) {
                    console.error('Error recording view:', error);
                    return false;
                }
            }
            
            return true;
        } catch (err) {
            console.error('Failed to record view:', err);
            return false;
        }
    },
    
    // Track page view for analytics
    async trackPageView(pagePath, pageTitle) {
        try {
            const ipHash = await this.getIPHash();
            
            // Don't await, fire and forget
            supabaseClient
                .from('page_views')
                .insert([{
                    page_path: pagePath,
                    page_title: pageTitle,
                    ip_hash: ipHash,
                    user_agent: navigator.userAgent.slice(0, 150),
                    screen_size: `${window.screen.width}x${window.screen.height}`
                }])
                .then(({ error }) => {
                    if (error) console.error('Error tracking page view:', error);
                });
            
            return true;
        } catch (err) {
            console.error('Failed to track page view:', err);
            return false;
        }
    },
    
    // Toggle like
    async toggleLike(itemId, type) {
        const user = await this.getCurrentUser();
        if (!user) {
            showToast('Debes iniciar sesión para dar like', 'error');
            return false;
        }
        
        // Check if like exists
        const { data: existing } = await supabaseClient
            .from('likes')
            .select('id')
            .eq('item_id', itemId)
            .eq('type', type)
            .eq('user_id', user.id)
            .single();
        
        if (existing) {
            // Remove like
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('id', existing.id);
            if (error) throw error;
            return { action: 'removed', count: await this.getLikeCount(itemId, type) };
        } else {
            // Add like
            const { error } = await supabaseClient
                .from('likes')
                .insert([{
                    item_id: itemId,
                    type: type,
                    user_id: user.id
                }]);
            if (error) throw error;
            return { action: 'added', count: await this.getLikeCount(itemId, type) };
        }
    },
    
    // Get like count
    async getLikeCount(itemId, type) {
        const { count, error } = await supabaseClient
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', itemId)
            .eq('type', type);
        
        if (error) throw error;
        return count || 0;
    },
    
    // Auth functions
    async signUp(email, password) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    },
    
    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },
    
    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },
    
    async getCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },
    
    async getSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    },
    
    // Helper to get IP hash
    async getIPHash() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const { ip } = await response.json();
            // Simple hash function
            return btoa(ip).slice(0, 20);
        } catch {
            return 'unknown-' + Math.random().toString(36).slice(2, 10);
        }
    },
    
    // Get real-time stats for homepage
    async getStats() {
        try {
            // Get tools count
            const { count: toolsCount, error: toolsError } = await supabaseClient
                .from('tools')
                .select('*', { count: 'exact', head: true });
            
            // Get scripts count
            const { count: scriptsCount, error: scriptsError } = await supabaseClient
                .from('scripts')
                .select('*', { count: 'exact', head: true });
            
            // Get total downloads
            const { data: downloadsData, error: downloadsError } = await supabaseClient
                .from('downloads')
                .select('id');
            
            if (toolsError || scriptsError) throw toolsError || scriptsError;
            
            return {
                tools: toolsCount || 0,
                scripts: scriptsCount || 0,
                downloads: downloadsData?.length || 0
            };
        } catch (err) {
            console.error('Error fetching stats:', err);
            // Return fallback data
            return {
                tools: 0,
                scripts: 6,
                downloads: 0
            };
        }
    },
    
    // Check if user is authenticated
    async requireAuth() {
        const user = await this.getCurrentUser();
        if (!user) {
            showAuthModal('signin');
            return false;
        }
        return true;
    }
};

// Auth UI Functions
function showAuthModal(type = 'signin') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${type === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="auth-form">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="auth-email" required placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input type="password" class="form-input" id="auth-password" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;margin-top:16px;">
                        ${type === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </button>
                </form>
                <p style="text-align:center;margin-top:16px;color:var(--text-secondary);">
                    ${type === 'signin' 
                        ? '¿No tienes cuenta? <a href="#" onclick="switchAuthMode(\'signup\')">Regístrate</a>' 
                        : '¿Ya tienes cuenta? <a href="#" onclick="switchAuthMode(\'signin\')">Inicia sesión</a>'}
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));
    
    // Form submission
    modal.querySelector('#auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        try {
            if (type === 'signin') {
                await GubunDB.signIn(email, password);
                showToast('¡Bienvenido!');
            } else {
                await GubunDB.signUp(email, password);
                showToast('Cuenta creada. Verifica tu email.');
            }
            closeModal(modal.querySelector('.modal-close'));
            updateAuthUI();
        } catch (err) {
            showToast(err.message || 'Error de autenticación', 'error');
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.querySelector('.modal-close'));
    });
}

function switchAuthMode(type) {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        closeModal(modal.querySelector('.modal-close'));
        setTimeout(() => showAuthModal(type), 300);
    }
}

async function updateAuthUI() {
    const user = await GubunDB.getCurrentUser();
    const navMenu = document.querySelector('.nav-menu');
    
    // Remove existing auth button
    const existingAuth = document.querySelector('.nav-auth');
    if (existingAuth) existingAuth.remove();
    
    if (user) {
        // Show user menu with avatar
        const userInitial = user.email.charAt(0).toUpperCase();
        const userName = user.email.split('@')[0];
        const authLi = document.createElement('li');
        authLi.className = 'nav-auth';
        authLi.innerHTML = `
            <div class="user-menu">
                <button class="user-avatar-btn" onclick="toggleUserMenu()" title="${user.email}">
                    <div class="user-avatar">${userInitial}</div>
                    <span class="user-name">${userName}</span>
                </button>
                <div class="user-dropdown" id="user-dropdown" style="display:none;">
                    <div class="user-dropdown-header">
                        <div class="user-avatar-large">${userInitial}</div>
                        <div class="user-info">
                            <p class="user-email">${user.email}</p>
                        </div>
                    </div>
                    <div class="user-dropdown-divider"></div>
                    <a href="#" onclick="handleSignOut();return false;">
                        <span>🚪</span> Cerrar sesión
                    </a>
                </div>
            </div>
        `;
        navMenu.appendChild(authLi);
    } else {
        // Show sign in button
        const authLi = document.createElement('li');
        authLi.className = 'nav-auth';
        authLi.innerHTML = `<a href="#" class="nav-link" onclick="showAuthModal();return false;">Iniciar sesión</a>`;
        navMenu.appendChild(authLi);
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

async function handleSignOut() {
    try {
        await GubunDB.signOut();
        showToast('Sesión cerrada');
        updateAuthUI();
    } catch (err) {
        showToast('Error al cerrar sesión', 'error');
    }
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);
