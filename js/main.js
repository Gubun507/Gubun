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
    
    // Get first 5 lines of code for preview
    const codeLines = script.code.split('\n').slice(0, 5).join('\n');
    const codePreview = escapeHtml(codeLines);
    
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
                <div class="code-preview-mini" style="margin:12px 0;background:var(--bg-darker);border-radius:var(--radius);padding:12px;font-family:monospace;font-size:0.75rem;overflow:hidden;">
                    <div style="color:var(--text-muted);margin-bottom:4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.5px;">Preview (5 líneas)</div>
                    <pre style="margin:0;color:var(--text-secondary);white-space:pre-wrap;word-break:break-all;line-height:1.4;"><code>${codePreview}</code></pre>
                </div>
                <div class="card-footer">
                    <button class="btn btn-small btn-primary" onclick="showCodeModal('${script.id}')">Ver Código</button>
                </div>
            </div>
        </article>
    `;
}

function renderStars(rating) {
    const full = '★';
    const empty = '☆';
    const rounded = Math.round(rating);
    return full.repeat(rounded) + empty.repeat(5 - rounded);
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
                        <button class="btn btn-small btn-outline" onclick="showPostModal('${post.id}')">Leer más</button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

async function showPostModal(postId) {
    if (!GUBUN_DATA || !GUBUN_DATA.posts) return;
    
    const post = GUBUN_DATA.posts.find(p => p.id === postId);
    if (!post) return;
    
    // Check auth
    let isAuth = false;
    let currentUser = null;
    if (typeof GubunDB !== 'undefined') {
        currentUser = await GubunDB.getCurrentUser();
        isAuth = currentUser !== null;
    }
    
    // Get real rating and comments from Supabase
    let rating = 0;
    let ratingCount = 0;
    let commentCount = 0;
    if (typeof GubunDB !== 'undefined') {
        const ratingData = await GubunDB.getPostRating(postId);
        rating = ratingData.avg;
        ratingCount = ratingData.count;
        commentCount = await GubunDB.getPostCommentCount(postId);
    }
    
    const ratingDisplay = rating > 0 
        ? `<span style="color:var(--warning);font-size:1.2rem;">${renderStars(rating)}</span>`
        : '<span style="color:var(--text-muted);">☆☆☆☆☆</span>';
    
    const scriptLink = post.relatedScript 
        ? `<a href="../scripts/#${post.relatedScript}" class="btn btn-primary">📦 Descargar Script</a>` 
        : '';
    
    // Check if user has rated
    let userRating = 0;
    if (isAuth && typeof GubunDB !== 'undefined') {
        userRating = await GubunDB.getUserPostRating(postId);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = `post-modal-${postId}`;
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
                <!-- Stats Bar -->
                <div style="display:flex;gap:20px;padding:16px;background:var(--bg-darker);border-radius:var(--radius);margin-bottom:20px;flex-wrap:wrap;align-items:center;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${ratingDisplay}
                        ${ratingCount > 0 ? `<span style="color:var(--text-muted);font-size:0.875rem;">(${ratingCount} ${ratingCount === 1 ? 'voto' : 'votos'})</span>` : '<span style="color:var(--text-muted);font-size:0.875rem;">(Sin calificaciones)</span>'}
                    </div>
                    ${commentCount > 0 ? `
                    <div style="display:flex;align-items:center;gap:6px;color:var(--text-muted);">
                        <span>💬</span>
                        <span>${commentCount} ${commentCount === 1 ? 'comentario' : 'comentarios'}</span>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Content -->
                <div class="post-content" style="line-height:1.8;color:var(--text-secondary);margin-bottom:30px;">
                    ${post.content || '<p>' + post.excerpt + '</p>'}
                </div>
                
                <!-- Rating Section -->
                <div style="border-top:1px solid var(--border-color);padding-top:20px;margin-bottom:20px;">
                    <h4 style="margin:0 0 16px 0;color:var(--text-primary);">⭐ Califica este tutorial</h4>
                    ${isAuth ? `
                    <div class="rating-input" style="display:flex;gap:8px;font-size:1.5rem;margin-bottom:12px;">
                        ${[1,2,3,4,5].map(star => `
                            <button class="star-btn" data-rating="${star}" onclick="submitPostRating('${postId}', ${star})" 
                                style="background:none;border:none;cursor:pointer;color:${star <= userRating ? 'var(--warning)' : 'var(--text-muted)'};transition:transform 0.2s;"
                                onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                                ${star <= userRating ? '★' : '☆'}
                            </button>
                        `).join('')}
                    </div>
                    ${userRating > 0 ? `<p style="color:var(--success);font-size:0.875rem;margin:0;">✓ Has calificado con ${userRating} estrellas</p>` : '<p style="color:var(--text-muted);font-size:0.875rem;margin:0;">Haz clic para calificar</p>'}
                    ` : `
                    <p style="color:var(--text-muted);font-size:0.875rem;">
                        <a href="#" onclick="closeModal(this); showAuthModal('signin'); return false;" style="color:var(--accent);">Inicia sesión</a> para calificar este tutorial
                    </p>
                    `}
                </div>
                
                <!-- Comments Section -->
                <div style="border-top:1px solid var(--border-color);padding-top:20px;">
                    <h4 style="margin:0 0 16px 0;color:var(--text-primary);">💬 Comentarios (${commentCount})</h4>
                    
                    ${isAuth ? `
                    <div class="comment-form" style="margin-bottom:20px;">
                        <textarea id="comment-input-${postId}" placeholder="Escribe tu comentario..." 
                            style="width:100%;padding:12px;border:1px solid var(--border-color);border-radius:var(--radius);background:var(--bg-darker);color:var(--text-primary);resize:vertical;min-height:80px;font-family:inherit;"></textarea>
                        <button class="btn btn-primary" style="margin-top:8px;" onclick="submitPostComment('${postId}')">Publicar comentario</button>
                    </div>
                    ` : `
                    <div style="padding:16px;background:var(--bg-darker);border-radius:var(--radius);text-align:center;margin-bottom:20px;">
                        <p style="color:var(--text-muted);margin:0;">
                            <a href="#" onclick="closeModal(this); showAuthModal('signin'); return false;" style="color:var(--accent);">Inicia sesión</a> para comentar
                        </p>
                    </div>
                    `}
                    
                    <!-- Comments List -->
                    <div id="comments-list-${postId}" class="comments-list" style="display:flex;flex-direction:column;gap:16px;">
                        <p style="color:var(--text-muted);text-align:center;padding:20px;">Cargando comentarios...</p>
                    </div>
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
    
    // Load comments
    loadPostComments(postId);
}

async function submitPostRating(postId, rating) {
    if (typeof GubunDB === 'undefined') return;
    
    const success = await GubunDB.ratePost(postId, rating);
    if (success) {
        showToast(`✓ Calificado con ${rating} estrellas`, 'success');
        // Update UI
        const post = GUBUN_DATA.posts.find(p => p.id === postId);
        if (post) {
            post.ratingCount = (post.ratingCount || 0) + 1;
            post.rating = ((post.rating || 0) * (post.ratingCount - 1) + rating) / post.ratingCount;
        }
        // Re-open modal to refresh
        closeModal(document.querySelector(`#post-modal-${postId} .modal-close`));
        setTimeout(() => showPostModal(postId), 300);
    } else {
        showToast('Error al calificar', 'error');
    }
}

async function submitPostComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) {
        showToast('Escribe un comentario', 'error');
        return;
    }
    
    if (typeof GubunDB === 'undefined') return;
    
    const success = await GubunDB.addPostComment(postId, content);
    if (success) {
        showToast('✓ Comentario publicado', 'success');
        input.value = '';
        loadPostComments(postId);
        // Update count
        const post = GUBUN_DATA.posts.find(p => p.id === postId);
        if (post) post.commentCount = (post.commentCount || 0) + 1;
    } else {
        showToast('Error al publicar', 'error');
    }
}

async function loadPostComments(postId) {
    const container = document.getElementById(`comments-list-${postId}`);
    if (!container) return;
    
    if (typeof GubunDB === 'undefined') {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Conecta Supabase para ver comentarios</p>';
        return;
    }
    
    const comments = await GubunDB.getPostComments(postId);
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Sin comentarios. ¡Sé el primero!</p>';
        return;
    }
    
    const currentUser = await GubunDB.getCurrentUser();
    
    container.innerHTML = comments.map(comment => {
        const isOwner = currentUser && comment.user_id === currentUser.id;
        return `
            <div class="comment" style="padding:16px;background:var(--bg-darker);border-radius:var(--radius);border:1px solid var(--border-color);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:0.875rem;">
                            ${(comment.user_email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style="margin:0;font-weight:500;color:var(--text-primary);font-size:0.875rem;">${comment.user_email || 'Usuario'}</p>
                            <p style="margin:0;color:var(--text-muted);font-size:0.75rem;">${formatDate(comment.created_at)}</p>
                        </div>
                    </div>
                    ${isOwner ? `
                    <button onclick="deletePostComment('${postId}', '${comment.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1.2rem;opacity:0.7;" title="Eliminar">🗑️</button>
                    ` : ''}
                </div>
                <p style="margin:0;color:var(--text-secondary);line-height:1.5;">${escapeHtml(comment.content)}</p>
            </div>
        `;
    }).join('');
}

async function deletePostComment(postId, commentId) {
    if (!confirm('¿Eliminar este comentario?')) return;
    
    if (typeof GubunDB === 'undefined') return;
    
    const success = await GubunDB.deletePostComment(commentId);
    if (success) {
        showToast('✓ Comentario eliminado', 'success');
        loadPostComments(postId);
        const post = GUBUN_DATA.posts.find(p => p.id === postId);
        if (post) post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
    } else {
        showToast('Error al eliminar', 'error');
    }
}

async function showCodeModal(scriptId) {
    const script = GUBUN_DATA.scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    // Check authentication
    let isAuth = false;
    if (typeof GubunDB !== 'undefined') {
        isAuth = await GubunDB.getCurrentUser() !== null;
    }
    
    // Show preview (first 5 lines) to everyone, full code only to logged users
    const codeLines = script.code.split('\n');
    const previewLines = 5;
    const displayCode = isAuth ? script.code : codeLines.slice(0, previewLines).join('\n') + '\n\n// � Desbloquea el script completo (300+ líneas)\n// Gratis al crear una cuenta';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width:800px;">
            <div class="modal-header">
                <h3 class="modal-title">${script.name}</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-secondary);margin-bottom:16px;">${script.description}</p>
                <div class="code-preview">
                    <div class="code-header">
                        <span class="code-lang">${script.language}</span>
                        <div style="display:flex;gap:8px;align-items:center;">
                            ${!isAuth ? '<span style="font-size:0.75rem;color:var(--warning);">🔒 Preview limitado</span>' : ''}
                            <button class="code-copy" onclick="copyCode(this)" title="${isAuth ? 'Copiar' : 'Copiar preview'}" ${!isAuth ? 'disabled style="opacity:0.5;"' : ''}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <pre class="code-content" style="max-height:400px;overflow:auto;"><code>${escapeHtml(displayCode)}</code></pre>
                </div>
                <div class="card-tags" style="margin-top:16px;">
                    ${script.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ${!isAuth ? `
                <div style="margin-top:20px;padding:20px;background:linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%);border:1px solid var(--success);border-radius:var(--radius);text-align:center;">
                    <p style="margin:0 0 8px 0;color:var(--text-primary);font-weight:600;font-size:1.1rem;">� Desbloquea el script completo (300+ líneas)</p>
                    <p style="margin:0 0 16px 0;font-size:0.875rem;color:var(--text-secondary);">Gratis al crear una cuenta</p>
                    <button class="btn btn-primary" onclick="closeModal(this); showAuthModal('signup');">Crear cuenta gratis</button>
                </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cerrar</button>
                <button class="btn btn-primary" onclick="downloadScript('${script.id}')" ${!isAuth ? 'disabled style="opacity:0.5;"' : ''}>⬇ Descargar</button>
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

// Keep Render free tier awake - ping every 7 minutes
(function keepAlive() {
    const pingInterval = 7 * 60 * 1000; // 7 minutes
    const pingUrl = window.location.origin + '/index.html';
    
    setInterval(() => {
        fetch(pingUrl, { method: 'HEAD', mode: 'no-cors' })
            .then(() => console.log('[KeepAlive] Ping successful'))
            .catch(() => console.log('[KeepAlive] Ping failed'));
    }, pingInterval);
    
    console.log('[KeepAlive] Initialized - pinging every 7 minutes');
})();
