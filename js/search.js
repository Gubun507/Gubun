class SearchEngine {
    constructor() {
        this.data = GUBUN_DATA;
        this.searchInput = document.getElementById('global-search');
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
            
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
    }
    
    handleSearch(query) {
        if (!query || query.trim().length < 2) return;
        
        const results = this.search(query);
        this.showResults(results, query);
    }
    
    search(query) {
        const searchTerm = query.toLowerCase().trim();
        const results = {
            tools: [],
            scripts: [],
            posts: []
        };
        
        results.tools = this.data.tools.filter(tool => 
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.description.toLowerCase().includes(searchTerm) ||
            tool.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            tool.category.toLowerCase().includes(searchTerm)
        );
        
        results.scripts = this.data.scripts.filter(script => 
            script.name.toLowerCase().includes(searchTerm) ||
            script.description.toLowerCase().includes(searchTerm) ||
            script.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            script.engine.toLowerCase().includes(searchTerm) ||
            script.language.toLowerCase().includes(searchTerm)
        );
        
        results.posts = this.data.posts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.excerpt.toLowerCase().includes(searchTerm) ||
            post.category.toLowerCase().includes(searchTerm)
        );
        
        return results;
    }
    
    showResults(results, query) {
        const totalResults = results.tools.length + results.scripts.length + results.posts.length;
        
        if (totalResults === 0) {
            this.showToast('No se encontraron resultados para "' + query + '"', 'error');
            return;
        }
        
        let message = `Encontrados ${totalResults} resultados:`;
        if (results.tools.length) message += ` ${results.tools.length} herramientas`;
        if (results.scripts.length) message += ` ${results.scripts.length} scripts`;
        if (results.posts.length) message += ` ${results.posts.length} artículos`;
        
        this.showToast(message, 'success');
        
        if (window.location.pathname.includes('herramientas')) {
            window.renderTools?.(results.tools);
        } else if (window.location.pathname.includes('scripts')) {
            window.renderScripts?.(results.scripts);
        } else {
            sessionStorage.setItem('searchResults', JSON.stringify(results));
            sessionStorage.setItem('searchQuery', query);
        }
    }
    
    filterTools(category = 'all', sort = 'featured') {
        let filtered = [...this.data.tools];
        
        if (category !== 'all') {
            filtered = filtered.filter(tool => tool.category === category);
        }
        
        switch (sort) {
            case 'downloads':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                filtered.reverse();
                break;
            default:
                filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        }
        
        return filtered;
    }
    
    filterScripts(engine = 'all', language = 'all', sort = 'featured') {
        let filtered = [...this.data.scripts];
        
        if (engine !== 'all') {
            filtered = filtered.filter(script => script.engine === engine);
        }
        
        if (language !== 'all') {
            filtered = filtered.filter(script => script.language === language);
        }
        
        switch (sort) {
            case 'downloads':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            default:
                filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        }
        
        return filtered;
    }
    
    showToast(message, type = 'success') {
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.searchEngine = new SearchEngine();
});
