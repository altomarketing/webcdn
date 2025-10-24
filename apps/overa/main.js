/**
 * main.js
 * Archivo unificado de scripts para el reproductor de radio PWA/HTML.
 */

// --- VARIABLES Y CONSTANTES GLOBALES / DE ALCANCE GENERAL ---
const DEFAULT_IMG = "https://i.postimg.cc/k5nWy1Rn/SAVE-20251014-124756-1.jpg";
const BUBBLE_CAP = 200; // Límite de burbujas para el modal TV
const colors = ['radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,0,0,0.7))', 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(0,150,255,0.7))', 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(0,200,120,0.7))', 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,180,0,0.7))', 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(190,0,255,0.7))'];

let triedOnce = false; // Bandera para el intento de carátula de iTunes
let isOpen = false; // Estado del panel lateral (webSidePanel)
let touchStartX = 0; // Posición inicial de toque para gestos del panel lateral
let touchEndX = 0; // Posición final de toque para gestos del panel lateral


// --- FUNCIÓN DE UTILIDAD: Media Session (Actualiza la notificación del SO) ---
if ('mediaSession' in navigator) {
    window.__updateMediaSession = function({
        title,
        artist,
        artworkSrc
    }) {
        try {
            const artSrc = artworkSrc || (document.querySelector('.logo') ? document.querySelector('.logo').src : '');
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'DJ Gato',
                artist: artist || '',
                album: 'DJ Gato',
                artwork: artSrc ? [{
                    src: artSrc,
                    sizes: '96x96',
                    type: 'image/png'
                }, {
                    src: artSrc,
                    sizes: '192x192',
                    type: 'image/png'
                }, {
                    src: artSrc,
                    sizes: '512x512',
                    type: 'image/png'
                }] : []
            });
        } catch (e) {
            console.debug('MediaSession metadata error:', e);
        }
    };
    // Manejadores de control (play/pause) desde la notificación del sistema
    try {
        const audio = document.getElementById('audioPlayer');
        if (audio) {
            navigator.mediaSession.setActionHandler('play', () => audio.play().catch(() => {}));
            navigator.mediaSession.setActionHandler('pause', () => audio.pause());
            navigator.mediaSession.setActionHandler('stop', () => audio.pause());
            navigator.mediaSession.playbackState = 'playing';
        }
    } catch (e) {
        /* no-op */
    }
}


// --- FUNCIÓN PRINCIPAL: Actualizar metadatos de la canción (Fetch principal) ---
async function actualizarMetadata() {
    try {
        const res = await fetch("https://sp.oyotunstream.com/cp/get_info.php?p=8048");
        const data = await res.json();
        let cancion = "";
        let artista = "DJ Gato";

        if (data.songtitle) {
            const partes = data.songtitle.split(" - ");
            if (partes.length >= 2) {
                cancion = partes[0].trim();
                artista = partes[1].trim();
            } else {
                cancion = data.songtitle.trim();
            }
        } else if (data.title) {
            cancion = data.title.trim() || "En Vivo";
            artista = data.artist ? data.artist.trim() : artista;
        } else if (data.history && data.history.length > 0) {
            // Elimina el prefijo '1.) ', '2.) ', etc.
            cancion = data.history[0].replace(/^\d+\.\)\s*/, "").trim(); 
        } else {
            cancion = "Transmitiendo en vivo";
        }

        const cover = data.art || data.artwork || "";
        const logoEl = document.querySelector(".logo");

        if (cover && logoEl) logoEl.src = cover;

        const artistaEl = document.getElementById("artista");
        const cancionEl = document.getElementById("cancion");
        if (artistaEl) artistaEl.textContent = artista;
        if (cancionEl) cancionEl.textContent = cancion;

        if (window.__updateMediaSession) {
            window.__updateMediaSession({
                title: cancion,
                artist: artista,
                artworkSrc: cover
            });
        }
    } catch (e) {
        console.error("Error obteniendo metadata:", e);
    }
}


// --- FUNCIÓN DE UTILIDAD: Intento de carátula de iTunes (Fallback) ---
async function tryFetchCover() {
    if (triedOnce) return;
    const logo = document.querySelector(".logo");
    if (!logo) return;

    // Solo si seguimos con imagen por defecto (o alguna de las predefinidas)
    if (!logo.src || logo.src === DEFAULT_IMG || logo.src.includes("Picsart-25-08-11-10-00-40-603.jpg")) {
        const artistaEl = document.getElementById("artista");
        const cancionEl = document.getElementById("cancion");
        const artista = (artistaEl && artistaEl.textContent || "").trim();
        const cancion = (cancionEl && cancionEl.textContent || "").trim();

        if (!artista || !cancion) return; // Esperar a tener ambos textos listos

        try {
            const q = encodeURIComponent(artista + " " + cancion);
            const r = await fetch("https://itunes.apple.com/search?term=" + q + "&media=music&limit=1", {
                cache: "no-store"
            });
            const j = await r.json();

            if (j && j.results && j.results.length) {
                const art100 = j.results[0].artworkUrl100;
                if (art100) {
                    const _it = art100.replace("100x100bb", "512x512bb");
                    logo.src = _it;
                    window.__lastCover = _it;

                    const __menuLogo2 = document.querySelector(".menu-logo");
                    if (__menuLogo2) __menuLogo2.src = _it;

                    if (window.__updateMediaSession) {
                        window.__updateMediaSession({
                            title: (document.getElementById("cancion") || {}).textContent || "",
                            artist: (document.getElementById("artista") || {}).textContent || "",
                            artworkSrc: _it
                        });
                    }
                    triedOnce = true;
                }
            }
        } catch (e) {
            console.debug("Fallback iTunes error:", e);
        }
    }
}


// --- FUNCIÓN: Abrir Contenido en Panel Lateral (webSidePanel) ---
function abrirEnPanel(url, mostrarCerrar = false) {
    const webSidePanel = document.getElementById('webSidePanel');
    const webSideOverlay = document.getElementById('webSideOverlay');
    const iframe = webSidePanel?.querySelector('iframe');
    
    if (!webSidePanel || !webSideOverlay || !iframe) return;
    
    iframe.src = url;
    
    // Lógica del botón de cerrar (solo si mostrarCerrar es true)
    let btnCerrar = document.getElementById('btnCerrarPanel');
    if (mostrarCerrar) {
        if (!btnCerrar) {
            btnCerrar = document.createElement('button');
            btnCerrar.id = 'btnCerrarPanel';
            btnCerrar.innerHTML = '✖';
            Object.assign(btnCerrar.style, {
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: '3200',
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            });
            btnCerrar.addEventListener('click', () => {
                webSidePanel.classList.remove('abierto');
                webSideOverlay.classList.remove('visible');
                btnCerrar.remove();
                isOpen = false;
            });
            webSidePanel.appendChild(btnCerrar);
        }
    } else {
        if (btnCerrar) btnCerrar.remove();
    }
    
    webSidePanel.classList.add('abierto');
    webSideOverlay.classList.add('visible');
    isOpen = true; // Actualiza el estado al abrir programáticamente
}


// --- FUNCIÓN: Abrir Modal TV (con burbujas y video HLS) ---
function abrirModalTV() {
    const audioPlayer = document.getElementById('audioPlayer');
    let wasPlaying = audioPlayer && !audioPlayer.paused;
    if (audioPlayer && wasPlaying) {
        audioPlayer.pause();
    }

    const contenedor = document.querySelector('.contenedor');
    if (contenedor) {
        contenedor.style.filter = 'blur(40px)';
        contenedor.style.transition = 'filter 0.3s ease';
    }

    // Estilos para burbujas flotantes
    if (!document.getElementById('tv-bubbles-style-float')) {
        const style = document.createElement('style');
        style.id = 'tv-bubbles-style-float';
        style.textContent = `
        @keyframes floatAround {
            0%   { transform: translate(var(--startX,0), var(--startY,0)) scale(var(--scale,1)); opacity: 0; }
            10%  { opacity: 0.10; }
            50%  { transform: translate(calc(var(--startX,0) + var(--driftX,20px)), calc(var(--startY,0) + var(--driftY,20px))) scale(calc(var(--scale,1) * 1.05)); }
            100% { transform: translate(var(--endX,0), var(--endY,-100vh)) scale(calc(var(--scale,1) * 1.1)); opacity: 0; }
        }
        .tv-bubbles-container-float {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 10000;
        }
        .tv-bubble-float {
            position: absolute;
            border-radius: 50%;
            animation-name: floatAround;
            animation-timing-function: ease-in-out;
            will-change: transform, opacity;
            opacity: 0.10;
            box-shadow: 0 0 12px rgba(255,255,255,0.25);
            filter: blur(var(--blur,0.5px));
        }`;
        document.head.appendChild(style);
    }

    // Modal TV (Contenedor principal)
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        padding: '20px',
        boxSizing: 'border-box'
    });

    // Contenedor de burbujas
    const bubbles = document.createElement('div');
    bubbles.className = 'tv-bubbles-container-float';
    modal.appendChild(bubbles);

    // Generación de burbujas
    let bubbleInterval;
    let bubbleCount = 0;
    
    function spawnBubble() {
        if (bubbleCount > BUBBLE_CAP) return;
        const b = document.createElement('span');
        b.className = 'tv-bubble-float';
        const size = Math.random() * 80 + 30;
        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + '%';
        b.style.top = Math.random() * 100 + '%';
        b.style.background = colors[Math.floor(Math.random() * colors.length)];
        const dur = Math.random() * 8 + 6;
        b.style.animationDuration = dur + 's';
        b.style.animationDelay = (Math.random() * 1.5).toFixed(2) + 's';
        b.style.setProperty('--scale', (Math.random() * 0.7 + 0.8).toFixed(2));
        b.style.setProperty('--blur', (Math.random() * 1.5).toFixed(2) + 'px');
        b.style.setProperty('--startX', (Math.random() * 200 - 100) + 'vw');
        b.style.setProperty('--startY', (Math.random() * 200 - 100) + 'vh');
        b.style.setProperty('--endX', (Math.random() * 200 - 100) + 'vw');
        b.style.setProperty('--endY', (Math.random() * -200 - 100) + 'vh');
        b.style.setProperty('--driftX', (Math.random() * 40 - 20) + 'px');
        b.style.setProperty('--driftY', (Math.random() * 40 - 20) + 'px');
        bubbles.appendChild(b);
        bubbleCount++;
        b.addEventListener('animationend', () => {
            b.remove();
            bubbleCount--;
        });
    }
    bubbleInterval = setInterval(spawnBubble, 120);
    for (let i = 0; i < 40; i++) spawnBubble();

    // Botón rojo "ESTAMOS VIENDO"
    const titulo = document.createElement('div');
    // ... (Código para crear el título)
    Object.assign(titulo.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'red',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '1.2em',
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '6px',
        marginBottom: '10px',
        textAlign: 'center',
        gap: '8px',
        zIndex: '10002'
    });
    const icono = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icono.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    icono.setAttribute('width', '22');
    icono.setAttribute('height', '22');
    icono.setAttribute('fill', 'white');
    icono.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M21 17H3V5h18v12zm0-14H3c-1.1 0-2 .9-2 2v14h22V5c0-1.1-.9-2-2-2zm-6 18H9v2h6v-2z');
    icono.appendChild(path);
    const texto = document.createElement('span');
    texto.innerText = 'ESTAMOS VIENDO';
    titulo.appendChild(icono);
    titulo.appendChild(texto);
    modal.appendChild(titulo);
    // ... (Fin del código para crear el título)

    // Video Player
    const video = document.createElement('video');
    Object.assign(video.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
    });
    video.controls = true;
    video.autoplay = true;

    const tvFrame = document.createElement('div');
    Object.assign(tvFrame.style, {
        border: '8px solid #111',
        borderRadius: '15px',
        boxShadow: '0 0 25px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        padding: '0',
        margin: '0',
        width: '90%',
        aspectRatio: '16 / 9',
        backgroundColor: 'black',
        display: 'inline-block'
    });
    tvFrame.appendChild(video);
    modal.appendChild(tvFrame);

    // Contenedor de redes sociales
    const redesContainer = document.createElement('div');
    const redesWrapper = document.createElement('div');
    
    // ... (Código para crear los iconos de redes sociales)
    Object.assign(redesContainer.style, {
        display: 'flex',
        gap: '15px',
        marginTop: '15px',
        zIndex: '10002',
        justifyContent: 'center'
    });
    const redes = [{
        url: 'https://facebook.com/',
        icon: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
        title: 'Facebook'
    }, {
        url: 'https://instagram.com/',
        icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
        title: 'Instagram'
    }, {
        url: 'https://youtube.com/',
        icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
        title: 'YouTube'
    }, {
        url: 'https://tiktok.com/',
        icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
        title: 'TikTok'
    }, {
        url: 'https://wa.me/',
        icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
        title: 'WhatsApp'
    }];
    redes.forEach(r => {
        const a = document.createElement('a');
        a.href = r.url;
        a.target = '_blank';
        a.title = r.title;
        Object.assign(a.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: 'white',
            borderRadius: '50%',
            overflow: 'hidden'
        });
        const img = document.createElement('img');
        img.src = r.icon;
        Object.assign(img.style, {
            width: '70%',
            height: '70%',
            objectFit: 'contain'
        });
        a.appendChild(img);
        redesContainer.appendChild(a);
    });
    Object.assign(redesWrapper.style, {
        background: 'transparent',
        backdropFilter: 'none',
        borderRadius: '10px',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginTop: '15px',
        zIndex: '10002'
    });
    redesWrapper.appendChild(redesContainer);
    modal.appendChild(redesWrapper);
    // ... (Fin del código para crear los iconos de redes sociales)

    // Inicializar HLS
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource('https://vs20.live.opencaster.com/incatv_6539e3fe/index.m3u8');
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = 'https://vs20.live.opencaster.com/incatv_6539e3fe/index.m3u8';
    }

    // Cerrar modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (contenedor) contenedor.style.filter = 'none';
            if (bubbleInterval) clearInterval(bubbleInterval);
            bubbles.replaceChildren();
            if (audioPlayer && wasPlaying) audioPlayer.play();
        }
    });

    document.body.appendChild(modal);
}


// --- LÓGICA DE INICIO Y EVENT LISTENERS (Se ejecuta cuando el DOM está listo) ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Inicialización y bucle de metadatos de la radio
    actualizarMetadata();
    setInterval(actualizarMetadata, 5000);
    setInterval(tryFetchCover, 6000); // Intento periódico de fallback de carátula
    setTimeout(tryFetchCover, 2500); // Primer intento de fallback de carátula
    
    
    // 2. Manejadores de Compartir (Reúne los dos scripts de compartir)
    const compartirHandler = function(e) {
        e.preventDefault();
        if (navigator.share) {
            navigator.share({
                title: 'DJ Gato',
                text: 'Escucha DJ Gato en vivo',
                url: window.location.href
            }).catch(err => console.log('Error al compartir:', err));
        } else {
            alert('La función de compartir no está soportada en este navegador.');
        }
    };
    
    document.getElementById('btnCompartir')?.addEventListener('click', compartirHandler);
    document.getElementById('btnCompartirMenu')?.addEventListener('click', compartirHandler);
    
    
    // 3. Manejo del Menú Lateral (menuLateral)
    const btnMenu = document.querySelector('.boton-menu');
    const menuLateral = document.getElementById('menuLateral');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (btnMenu && menuLateral && menuOverlay) {
        btnMenu.addEventListener('click', (e) => {
            e.preventDefault();
            menuLateral.classList.add('abierto');
            menuOverlay.classList.add('visible');
        });
        
        menuOverlay.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            menuOverlay.classList.remove('visible');
        });
    }


    // 4. Manejo del Panel Lateral con Gestos Táctiles (webSidePanel)
    const webSidePanel = document.getElementById('webSidePanel');
    const webSideOverlay = document.getElementById('webSideOverlay');
    const webSideCloseLayer = document.getElementById('webSideCloseLayer');
    
    if (webSidePanel && webSideOverlay && webSideCloseLayer) {
        // Abrir deslizando desde el borde derecho
        window.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        window.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            let screenWidth = window.innerWidth;
            if (!isOpen && touchStartX > screenWidth - 50 && touchEndX < touchStartX - 30) {
                webSidePanel.classList.add('abierto');
                webSideOverlay.classList.add('visible');
                isOpen = true;
                document.getElementById('btnCerrarPanel')?.remove(); // Asegura que el botón de cerrar se quite si se abre por gesto
            }
        });
        
        // Cerrar deslizando dentro de la capa invisible (cierre con swipe hacia la derecha)
        webSideCloseLayer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        webSideCloseLayer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            if (isOpen && touchEndX > touchStartX + 30) {
                webSidePanel.classList.remove('abierto');
                webSideOverlay.classList.remove('visible');
                isOpen = false;
                document.getElementById('btnCerrarPanel')?.remove();
            }
        });
        
        // Cerrar tocando overlay
        webSideOverlay.addEventListener('click', () => {
            webSidePanel.classList.remove('abierto');
            webSideOverlay.classList.remove('visible');
            isOpen = false;
            document.getElementById('btnCerrarPanel')?.remove();
        });
    }
    

    // 5. Manejo de enlaces del menú para abrir en el Panel Lateral
    if (webSidePanel && webSideOverlay) {
        // Enlace "Nos califica" (abre con botón de cerrar)
        const linkCalifica = document.querySelector('.menu-lista li a[href="https://Google.com"]');
        if (linkCalifica) {
            linkCalifica.addEventListener('click', function(e) {
                e.preventDefault();
                abrirEnPanel(this.href, true);
            });
        }
        
        // Otros enlaces del menú (abren sin botón de cerrar)
        document.querySelectorAll('.menu-lista li a').forEach(a => {
            if (a.href && a.href !== '#' && a.href !== 'https://Google.com') {
                a.addEventListener('click', function(e) {
                    if (!this.href.startsWith('mailto:')) {
                        e.preventDefault();
                        abrirEnPanel(this.href, false);
                    }
                });
            }
        });
    }

    // 6. Manejo del botón para abrir el Modal TV
    document.getElementById('btnTV')?.addEventListener('click', abrirModalTV);

    // 7. Registro de Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js').catch(function(e) {
            console.log('SW registration failed:', e);
        });
    }

    // 8. Sincronización de Logos (MutationObserver)
    const logo = document.querySelector('.logo');
    const menuLogo = document.querySelector('.menu-logo');
    if (logo && menuLogo && ('MutationObserver' in window)) {
        const sync = () => {
            if (logo.src && menuLogo.src !== logo.src) menuLogo.src = logo.src;
        };
        const mo = new MutationObserver(sync);
        mo.observe(logo, {
            attributes: true,
            attributeFilter: ['src']
        });
        // Sincronización inicial
        sync();
    }
});
