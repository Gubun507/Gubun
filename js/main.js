document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHomePage();
    initTooltips();
    initRealtimeStats();
    loadRealStats();
    
    // Track page view for analytics
    if (typeof GubunDB !== 'undefined') {
        GubunDB.trackPageView(window.location.pathname, document.title);
    }
});

// Load real stats from Supabase
async function loadRealStats() {
    if (typeof GubunDB !== 'undefined') {
        try {
            const stats = await GubunDB.getStats();
            
            // Update hero stats
            const toolsStat = document.querySelector('.hero-stats .stat:nth-child(1) .stat-number');
            const scriptsStat = document.querySelector('.hero-stats .stat:nth-child(2) .stat-number');
            const downloadsStat = document.querySelector('.hero-stats .stat:nth-child(3) .stat-number');
            
            if (toolsStat) toolsStat.textContent = stats.tools + (stats.tools >= 50 ? '+' : '');
            if (scriptsStat) scriptsStat.textContent = stats.scripts + (stats.scripts >= 10 ? '+' : '');
            if (downloadsStat) downloadsStat.textContent = formatNumberCompact(stats.downloads) + (stats.downloads >= 1000 ? '+' : '');
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }
}

function formatNumberCompact(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// Real-time stats update
function initRealtimeStats() {
    // Update stats every 30 seconds if Supabase is available
    if (typeof GubunDB !== 'undefined') {
        setInterval(loadRealStats, 30000);
    }
}

function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
    
    const currentPage = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage || 
            (currentPage !== '/' && link.getAttribute('href')?.includes(currentPage.split('/')[1]))) {
            link.classList.add('active');
        }
    });
}

function initHomePage() {
    const featuredTools = document.getElementById('featured-tools');
    const featuredScripts = document.getElementById('featured-scripts');
    const latestPosts = document.getElementById('latest-posts');
    
    if (featuredTools && GUBUN_DATA) {
        const tools = GUBUN_DATA.tools.filter(t => t.featured).slice(0, 3);
        if (tools.length === 0) {
            featuredTools.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 16px;">🔧</div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 8px; color: var(--text-primary);">Aún no hay herramienta publicada</h3>
                    <p style="color: var(--text-secondary);">Estamos trabajando en las primeras herramientas. ¡Vuelve pronto!</p>
                </div>
            `;
        } else {
            featuredTools.innerHTML = tools.map(tool => createToolCard(tool)).join('');
        }
    }
    
    if (featuredScripts && GUBUN_DATA) {
        const scripts = GUBUN_DATA.scripts.filter(s => s.featured).slice(0, 3);
        featuredScripts.innerHTML = scripts.map(script => createScriptCard(script)).join('');
    }
    
    if (latestPosts && GUBUN_DATA) {
        const posts = GUBUN_DATA.posts.slice(0, 3);
        latestPosts.innerHTML = posts.map(post => createPostCard(post)).join('');
    }
}

function createToolCard(tool) {
    return `
        <article class="card tool-card">
            <div class="card-body">
                <div class="card-header">
                    <div class="card-icon">${tool.icon}</div>
                    <div>
                        <h3 class="card-title">${tool.name}</h3>
                        <span class="card-meta">${tool.category}</span>
                    </div>
                </div>
                <p class="card-description">${tool.description}</p>
                <div class="card-tags">
                    ${tool.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <span class="card-stat">⬇ ${formatNumber(tool.downloads)}</span>
                        <span class="card-stat">★ ${tool.rating}</span>
                    </div>
                    <a href="${tool.link}" target="_blank" rel="noopener" class="btn btn-small btn-primary">Descargar</a>
                </div>
            </div>
        </article>
    `;
}

function createScriptCard(script) {
    const engineColors = {
        unity: 'tag-primary',
        unreal: 'tag-success',
        godot: 'tag-warning'
    };
    
    return `
        <article class="card script-card">
            <div class="card-body">
                <div class="card-header">
                    <div class="card-icon">${script.icon}</div>
                    <div>
                        <h3 class="card-title">${script.name}</h3>
                        <span class="card-meta">${script.engine}</span>
                    </div>
                </div>
                <p class="card-description">${script.description}</p>
                <div class="card-tags">
                    <span class="tag ${engineColors[script.engine] || ''}">${script.engine}</span>
                    <span class="tag">${script.language}</span>
                </div>
                <div class="card-footer">
                    <div class="card-stats">
                        <span class="card-stat">⬇ ${formatNumber(script.downloads)}</span>
                        <span class="card-stat">★ ${script.rating}</span>
                    </div>
                    <button class="btn btn-small btn-primary" onclick="showCodeModal('${script.id}')">Ver Código</button>
                </div>
            </div>
        </article>
    `;
}

function createPostCard(post) {
    const categoryColors = {
        unity: 'tag-primary',
        unreal: 'tag-success',
        godot: 'tag-warning',
        herramientas: ''
    };
    
    const scriptBadge = post.relatedScript 
        ? `<span class="tag tag-success" title="Incluye script descargable">📦 Script</span>` 
        : '';
    
    const scriptButton = post.relatedScript 
        ? `<a href="../scripts/#${post.relatedScript}" class="btn btn-small btn-primary" onclick="event.stopPropagation();">Ver script</a>`
        : '';
    
    return `
        <article class="card blog-card" onclick="showPostModal('${post.id}')" style="cursor:pointer;">
            <div class="card-image" style="display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--bg-darker);">
                ${post.image}
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <span class="tag ${categoryColors[post.category] || ''}">${post.category}</span>
                    ${scriptBadge}
                    <span>${post.readTime} de lectura</span>
                </div>
                <h3 class="card-title">${post.title}</h3>
                <p class="card-description">${post.excerpt}</p>
                <div class="card-footer">
                    <span class="card-meta">${formatDate(post.date)}</span>
                    <div style="display:flex;gap:8px;" onclick="event.stopPropagation();">
                        ${scriptButton}
                        <button class="btn btn-small btn-outline">Leer más</button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function showPostModal(postId) {
    if (!GUBUN_DATA || !GUBUN_DATA.posts) return;
    
    const post = GUBUN_DATA.posts.find(p => p.id === postId);
    if (!post) return;
    
    const scriptLink = post.relatedScript 
        ? `<a href="../scripts/#${post.relatedScript}" class="btn btn-primary">📦 Descargar Script</a>` 
        : '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width:800px;max-height:90vh;overflow-y:auto;">
            <div class="modal-header">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:2rem;">${post.image}</span>
                    <div>
                        <h3 class="modal-title">${post.title}</h3>
                        <span class="tag tag-primary">${post.category}</span>
                        <span style="color:var(--text-muted);font-size:0.875rem;margin-left:8px;">${post.readTime} de lectura</span>
                    </div>
                </div>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body" style="text-align:left;">
                <div class="post-content" style="line-height:1.8;color:var(--text-secondary);">
                    ${post.content || '<p>' + post.excerpt + '</p>'}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cerrar</button>
                ${scriptLink}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.querySelector('.modal-close'));
    });
}

async function showCodeModal(scriptId) {
    // Check authentication first
    if (typeof GubunDB !== 'undefined') {
        const isAuth = await GubunDB.requireAuth();
        if (!isAuth) {
            showToast('Debes iniciar sesión para ver scripts', 'error');
            return;
        }
    }
    
    const script = GUBUN_DATA.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${script.name}</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-secondary);margin-bottom:16px;">${script.description}</p>
                <div class="code-preview">
                    <div class="code-header">
                        <span class="code-lang">${script.language}</span>
                        <button class="code-copy" onclick="copyCode(this)" title="Copiar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <pre class="code-content"><code>${escapeHtml(script.code)}</code></pre>
                </div>
                <div class="card-tags" style="margin-top:16px;">
                    ${script.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cerrar</button>
                <button class="btn btn-primary" onclick="downloadScript('${script.id}')">⬇ Descargar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.querySelector('.modal-close'));
    });
}

function closeModal(element) {
    const modal = element.closest('.modal-overlay');
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

function copyCode(button) {
    const code = button.closest('.code-preview').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('Código copiado al portapapeles');
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        }, 2000);
    });
}

async function downloadScript(scriptId) {
    // Check authentication first
    if (typeof GubunDB !== 'undefined') {
        const isAuth = await GubunDB.requireAuth();
        if (!isAuth) {
            showToast('Debes iniciar sesión para descargar scripts', 'error');
            return;
        }
    }
    
    const script = GUBUN_DATA.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    // Record download in Supabase if available
    if (typeof GubunDB !== 'undefined') {
        try {
            await GubunDB.recordDownload(scriptId, 'script');
        } catch (err) {
            console.error('Error recording download:', err);
        }
    }
    
    const extensions = {
        csharp: 'cs',
        cpp: 'cpp',
        blueprint: 'txt',
        gdscript: 'gd'
    };
    
    const ext = extensions[script.language] || 'txt';
    const filename = `${script.name.replace(/\s+/g, '_')}.${ext}`;
    
    const blob = new Blob([script.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Descargando ${filename}`);
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initTooltips() {
    document.querySelectorAll('[title]').forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.getAttribute('title');
            document.body.appendChild(tooltip);
        });
    });
}

window.createToolCard = createToolCard;
window.createScriptCard = createScriptCard;
window.createPostCard = createPostCard;
window.showPostModal = showPostModal;
window.showCodeModal = showCodeModal;
window.closeModal = closeModal;
window.copyCode = copyCode;
window.downloadScript = downloadScript;
window.showToast = showToast;
