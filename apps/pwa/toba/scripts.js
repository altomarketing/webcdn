/* =========================================================================
   scripts.js — Radio Junto a Ti / Template genérico RadioNube
   Generado a partir de index.html. Unifica todos los <script> internos
   y gestiona la carga verificada del script remoto (hls.js).

   NOTA DE LIMPIEZA: el HTML original registraba el mismo EventSource de
   Zeno.fm en TRES bloques distintos (reloj/título, carátula iTunes/YouTube,
   y MediaSession). Eso abría 3 conexiones SSE redundantes al mismo stream.
   Aquí se unificó en una sola conexión que alimenta a los tres consumidores.

   También había DOS declaraciones de `installBtn`/`deferredPrompt` casi
   idénticas (una para el botón en bottom:100px y otra en bottom:20px) y
   un tercer bloque que repetía exactamente el segundo. Se dejó una sola
   implementación que registra cualquier botón con id="installBtn"
   presente en el DOM (soporta múltiples botones a la vez).
   ========================================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     0. Carga verificada del script remoto: hls.js
     -------------------------------------------------------------------- */
  // SRI requiere una versión fija (no "@latest"), porque el hash de
  // integridad se calcula sobre un archivo concreto. Se fija 1.5.15.
  // Si necesitás seguir usando @latest, quitá el atributo "integrity"
  // y conservá solo la verificación de éxito/fallo de carga.
  function loadScriptWithIntegrity(src, integrityHash) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve(existing);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      if (integrityHash) {
        script.integrity = integrityHash;
      }
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`No se pudo cargar el script: ${src}`));
      document.head.appendChild(script);
    });
  }

  const HLS_JS_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js";
  // Hash de ejemplo — reemplazar por el hash real publicado por jsDelivr
  // para la versión fijada antes de pasar a producción.
  const HLS_JS_INTEGRITY = "sha384-REEMPLAZAR_CON_HASH_SRI_REAL";

  const hlsReady = loadScriptWithIntegrity(HLS_JS_URL, HLS_JS_INTEGRITY).catch((err) => {
    console.error("❌ hls.js no se pudo cargar, el video TV podría no reproducirse en navegadores sin soporte HLS nativo:", err);
  });

  /* -----------------------------------------------------------------------
     1. Variables del template (inyectadas por JSON remoto)
     -------------------------------------------------------------------- */
  // window.SITE_CONFIG es poblado por el bloque inline en el <head>/<body>
  // que hace fetch a unavozenaccion.json antes de que este script corra.
  function getConfig() {
    return window.SITE_CONFIG || {};
  }

  /* -----------------------------------------------------------------------
     2. Reloj
     -------------------------------------------------------------------- */
  function actualizarReloj() {
    const reloj = document.getElementById("reloj");
    if (!reloj) return;
    const ahora = new Date();
    let horas = ahora.getHours();
    const minutos = ahora.getMinutes().toString().padStart(2, "0");
    const segundos = ahora.getSeconds().toString().padStart(2, "0");
    const ampm = horas >= 12 ? "PM" : "AM";
    horas = horas % 12;
    horas = horas ? horas : 12;
    reloj.textContent = `${horas.toString().padStart(2, "0")}:${minutos}:${segundos} ${ampm}`;
  }

  /* -----------------------------------------------------------------------
     3. Reproductor de radio (icono play/pause, equalizer, título)
     -------------------------------------------------------------------- */
  function setPlayIcon(playIconEl, state) {
    if (!playIconEl) return;
    playIconEl.innerHTML =
      state === "pause"
        ? '<path d="M6 19h4V5H6zm8-14v14h4V5h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
  }

  function initRadioPlayer() {
    const player = document.getElementById("radioPlayer");
    const playBtn = document.getElementById("playBtn");
    const playIcon = document.getElementById("playIcon");
    const equalizer = document.getElementById("equalizer");
    const subtitleEl = document.querySelector(".subtitle");

    if (!player) return null;

    function togglePlay() {
      if (player.paused) {
        player.play().catch(() => {});
        setPlayIcon(playIcon, "pause");
        if (equalizer) equalizer.classList.remove("paused");
      } else {
        player.pause();
        setPlayIcon(playIcon, "play");
        if (equalizer) equalizer.classList.add("paused");
      }
    }

    if (playBtn) playBtn.addEventListener("click", togglePlay);

    player.addEventListener("play", () => {
      setPlayIcon(playIcon, "pause");
      if (equalizer) equalizer.classList.remove("paused");
    });
    player.addEventListener("pause", () => {
      setPlayIcon(playIcon, "play");
      if (equalizer) equalizer.classList.add("paused");
    });

    // Funcionalidad para el botón "Radio en Vivo"
    window.playRadio = function () {
      if (player.paused) {
        player.play().catch(() => {});
        setPlayIcon(playIcon, "pause");
        if (equalizer) equalizer.classList.remove("paused");
      }
    };

    // Botón alternativo #playButton: setea src bajo demanda si aún no lo tiene
    const playButtonAlt = document.querySelector("#playButton");
    if (playButtonAlt) {
      playButtonAlt.addEventListener("click", () => {
        const config = getConfig();
        if (!player.src && config.radio_url) {
          player.src = config.radio_url;
        }
        player.play().catch(() => {});
      });
    }

    // Autoplay best-effort al cargar
    player.play().catch(() => {});

    return { player, playBtn, playIcon, equalizer, subtitleEl, togglePlay };
  }

  /* -----------------------------------------------------------------------
     4. Metadata en vivo (Zeno.fm SSE) — única conexión compartida
        Alimenta: título en el footer, carátula (iTunes/YouTube fallback)
        y MediaSession (notificación del sistema / lockscreen).
     -------------------------------------------------------------------- */
  function fetchArtworkITunes(query) {
    const clean = query.replace(/ *\([^)]*\) */g, "").replace(/ - Topic/g, "").trim();
    const term = encodeURIComponent(clean);
    return fetch(`https://itunes.apple.com/search?term=${term}&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
          return data.results[0].artworkUrl100;
        }
        return null;
      })
      .catch(() => null);
  }

  function tryYouTubeThumb(query, caratula, caratulaImg) {
    const ytQuery = encodeURIComponent(query);
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/results?search_query=${ytQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.thumbnail_url && caratula && caratulaImg) {
          caratulaImg.src = data.thumbnail_url;
          caratula.style.display = "block";
        } else if (caratula) {
          caratula.style.display = "none";
        }
      })
      .catch(() => {
        if (caratula) caratula.style.display = "none";
      });
  }

  function updateMediaSession(title, imgUrl) {
    if (!("mediaSession" in navigator)) return;
    const config = getConfig();
    const fallbackImg = config.logo_url || "";
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || config.site_title || "Radio en vivo",
      artist: config.site_subtitle || config.site_title || "",
      artwork: [
        {
          src: imgUrl || fallbackImg,
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
  }

  function initLiveMetadata() {
    const subtitleEl = document.querySelector(".subtitle");
    const caratula = document.getElementById("caratulaContainer");
    const caratulaImg = document.getElementById("caratulaImg");
    const config = getConfig();

    const metadataStreamUrl = config.metadata_stream_url || "https://api.zeno.fm/mounts/metadata/subscribe/iozlt3picr0vv";

    let es;
    try {
      es = new EventSource(metadataStreamUrl);
    } catch (err) {
      console.error("❌ No se pudo abrir la conexión de metadata:", err);
      return;
    }

    es.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      const title = (data && data.streamTitle) || "Sin título";

      // Título en footer
      if (subtitleEl) subtitleEl.innerHTML = `<span class="scrolling-text">${title}</span>`;

      // Carátula
      if (caratula && caratulaImg) {
        fetchArtworkITunes(title).then((img) => {
          if (img) {
            caratulaImg.src = img.replace("100x100bb", "300x300bb");
            caratula.style.display = "block";
          } else {
            tryYouTubeThumb(title, caratula, caratulaImg);
          }
        });
      }

      // MediaSession
      fetchArtworkITunes(title).then((img) => {
        updateMediaSession(title, img ? img.replace("100x100bb", "512x512bb") : null);
      });
    };

    es.onerror = () => {
      console.warn("⚠️ Conexión de metadata interrumpida, el navegador reintentará automáticamente.");
    };
  }

  /* -----------------------------------------------------------------------
     5. TV / video en vivo (modal + HLS)
     -------------------------------------------------------------------- */
  function closeTVModal() {
    const modal = document.getElementById("tvModal");
    const player = document.getElementById("tvPlayer");
    if (modal) modal.style.display = "none";
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
  }

  function playTV() {
    const player = document.getElementById("tvPlayer");
    if (player) player.play().catch(() => {});

    const radio = document.getElementById("radioPlayer");
    if (radio && !radio.paused) {
      radio.pause();
      const equalizer = document.getElementById("equalizer");
      const playIcon = document.getElementById("playIcon");
      if (equalizer) equalizer.classList.add("paused");
      setPlayIcon(playIcon, "play");
    }
    const modal = document.getElementById("tvModal");
    if (modal) modal.style.display = "block";
  }

  function togglePlayTV() {
    const tv = document.getElementById("tvPlayer");
    if (!tv) return;
    if (tv.paused) tv.play().catch(() => {});
    else tv.pause();
  }

  function changeVolume(delta) {
    const tv = document.getElementById("tvPlayer");
    if (!tv) return;
    const vol = tv.volume + delta;
    tv.volume = Math.max(0, Math.min(1, vol));
  }

  function toggleFullScreen() {
    const tv = document.getElementById("tvPlayer");
    if (!tv) return;
    if (!document.fullscreenElement) {
      (tv.requestFullscreen && tv.requestFullscreen()) ||
        (tv.webkitRequestFullscreen && tv.webkitRequestFullscreen());
    } else {
      (document.exitFullscreen && document.exitFullscreen()) ||
        (document.webkitExitFullscreen && document.webkitExitFullscreen());
    }
  }

  function initTVModalOutsideClick() {
    window.addEventListener("click", (event) => {
      const modal = document.getElementById("tvModal");
      if (modal && event.target === modal) {
        closeTVModal();
      }
    });
  }

  function initTVLazyContainer() {
    const tvBlock = document.getElementById("tvContainer");
    if (!tvBlock) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !tvBlock.dataset.loaded) {
          tvBlock.innerHTML =
            '<video id="tvPlayer" width="100%" height="240" controls muted autoplay playsinline style="border-radius:12px;"></video>';
          tvBlock.dataset.loaded = "true";
        }
      });
    });
    observer.observe(tvBlock);
  }

  function initTVPlaceholderOnLoad() {
    const tvIframe = document.querySelector("iframe[src*='emanueltv']");
    const config = getConfig();
    const placeholderSrc = config.tv_placeholder_url;
    if (tvIframe && placeholderSrc) {
      const placeholder = document.createElement("img");
      placeholder.src = placeholderSrc;
      placeholder.style.cssText = "width:100%;max-width:500px;margin:auto;display:block;border-radius:16px;";
      placeholder.id = "tvPlaceholder";
      tvIframe.parentNode.insertBefore(placeholder, tvIframe);
      tvIframe.addEventListener("load", () => {
        placeholder.style.display = "none";
      });
    }
  }

  function initTVPosterUntilReady() {
    const tv = document.getElementById("tvPlayer");
    if (!tv || !tv.parentElement) return;
    const config = getConfig();
    const posterSrc = config.tv_loading_image_url;
    if (!posterSrc) return;

    const container = tv.parentElement;
    container.style.position = "relative";
    tv.style.display = "none";

    const existing = document.getElementById("tvLoadingImage");
    if (existing) existing.remove();

    const placeholder = document.createElement("img");
    placeholder.src = posterSrc;
    placeholder.id = "tvLoadingImage";
    Object.assign(placeholder.style, {
      display: "block",
      width: "100%",
      maxHeight: "70vh",
      border: "3px solid white",
      borderRadius: "8px",
      objectFit: "cover",
      background: "black",
      margin: "12px auto",
    });
    container.insertBefore(placeholder, tv);

    let videoReady = false;
    const mostrarVideo = () => {
      if (videoReady) return;
      videoReady = true;
      placeholder.style.display = "none";
      tv.style.display = "block";
      tv.classList.add("tv-animacion");
      tv.play().catch((err) => console.warn("Autoplay bloqueado:", err));
    };

    tv.addEventListener("loadeddata", () => setTimeout(mostrarVideo, 1000));
    tv.addEventListener("canplay", () => {
      setTimeout(() => {
        if (tv.readyState >= 3) mostrarVideo();
      }, 1000);
    });
    tv.addEventListener("playing", mostrarVideo);
    setTimeout(() => {
      if (!videoReady) mostrarVideo();
    }, 7000);
  }

  function initHlsStream() {
    hlsReady.then(() => {
      const video = document.getElementById("tvPlayer");
      const config = getConfig();
      const tvStream = config.video_stream_url;
      if (!video || !tvStream) return;

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(tvStream);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = tvStream;
      }
    });
  }

  /* -----------------------------------------------------------------------
     6. Menú lateral
     -------------------------------------------------------------------- */
  function abrirMenu() {
    const menu = document.getElementById("menuLateral");
    if (menu) menu.classList.add("open");
  }

  function cerrarMenu() {
    const menu = document.getElementById("menuLateral");
    if (menu) menu.classList.remove("open");
  }

  function toggleSubmenuRedes() {
    const submenu = document.getElementById("submenu-redes");
    if (submenu) {
      submenu.style.display = submenu.style.display === "none" ? "block" : "none";
    }
  }

  function initMenuOutsideClick() {
    document.addEventListener("click", (event) => {
      const menu = document.getElementById("menuLateral");
      const toggle = document.querySelector(".menu-toggle");
      if (menu && toggle && menu.classList.contains("open") && !menu.contains(event.target) && !toggle.contains(event.target)) {
        menu.classList.remove("open");
      }
    });
  }

  /* -----------------------------------------------------------------------
     7. Saludos (localStorage)
     -------------------------------------------------------------------- */
  function cargarSaludos() {
    const contenedor = document.getElementById("saludosMostrados");
    if (!contenedor) return;
    const saludos = JSON.parse(localStorage.getItem("saludosGuardados") || "[]");
    saludos
      .slice()
      .reverse()
      .forEach(({ nombre, mensaje }, index) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.margin = "6px 0";
        div.style.fontSize = "14px";

        const p = document.createElement("span");
        p.innerHTML = `<strong>${nombre}:</strong> ${mensaje}`;

        const btn = document.createElement("button");
        btn.textContent = "🗑️";
        btn.style.marginLeft = "10px";
        btn.style.border = "none";
        btn.style.background = "transparent";
        btn.style.cursor = "pointer";
        btn.onclick = () => {
          saludos.splice(saludos.length - 1 - index, 1);
          localStorage.setItem("saludosGuardados", JSON.stringify(saludos));
          div.remove();
        };

        div.appendChild(p);
        div.appendChild(btn);
        contenedor.appendChild(div);
      });
  }

  function enviarSaludo() {
    const nombreInput = document.getElementById("nombreInput");
    const saludoInput = document.getElementById("saludoInput");
    if (!nombreInput || !saludoInput) return;

    const nombre = nombreInput.value.trim();
    const mensaje = saludoInput.value.trim();
    if (nombre && mensaje) {
      const saludo = { nombre, mensaje };
      const saludos = JSON.parse(localStorage.getItem("saludosGuardados") || "[]");
      saludos.push(saludo);
      localStorage.setItem("saludosGuardados", JSON.stringify(saludos));
      saludoInput.value = "";
      nombreInput.value = "";
      const contenedor = document.getElementById("saludosMostrados");
      if (contenedor) contenedor.innerHTML = "";
      cargarSaludos();
    }
  }

  /* -----------------------------------------------------------------------
     8. Botón "Instalar App" (PWA / beforeinstallprompt)
     -------------------------------------------------------------------- */
  function initInstallPrompt() {
    let deferredPrompt = null;
    const installButtons = Array.from(document.querySelectorAll("#installBtn, [data-install-btn]"));

    if (installButtons.length === 0) return;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installButtons.forEach((btn) => {
        btn.style.display = btn.dataset.installDisplay || "block";
      });
    });

    installButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          installButtons.forEach((b) => (b.style.display = "none"));
        }
        deferredPrompt = null;
      });
    });
  }

  /* -----------------------------------------------------------------------
     9. Service Worker
     -------------------------------------------------------------------- */
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("service-worker.js")
        .then(() => console.log("✅ SW registrado"))
        .catch((e) => console.error("❌ SW error", e));
    }
  }

  /* -----------------------------------------------------------------------
     10. Compartir
     -------------------------------------------------------------------- */
  function compartirSitio() {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href });
    } else {
      alert("No compatible");
    }
  }

  /* -----------------------------------------------------------------------
     11. Ocultar bloque de botón "Play/Pause" textual (limpieza de UI legada)
     -------------------------------------------------------------------- */
  function ocultarBotonesPlayPauseTextuales() {
    const botones = document.querySelectorAll("button");
    botones.forEach((btn) => {
      if (btn.innerText && btn.innerText.includes("Play/Pause")) {
        const contenedor = btn.closest("div");
        if (contenedor) contenedor.style.display = "none";
      }
    });
  }

  /* -----------------------------------------------------------------------
     12. Exponer funciones usadas vía onclick="" en el HTML
     -------------------------------------------------------------------- */
  window.playTV = playTV;
  window.closeTVModal = closeTVModal;
  window.togglePlay = togglePlayTV;
  window.changeVolume = changeVolume;
  window.toggleFullScreen = toggleFullScreen;
  window.abrirMenu = abrirMenu;
  window.cerrarMenu = cerrarMenu;
  window.toggleSubmenuRedes = toggleSubmenuRedes;
  window.enviarSaludo = enviarSaludo;
  window.compartirSitio = compartirSitio;

  /* -----------------------------------------------------------------------
     13. Bootstrap
     -------------------------------------------------------------------- */
  function init() {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    initRadioPlayer();
    initLiveMetadata();

    initTVModalOutsideClick();
    initTVLazyContainer();
    initTVPlaceholderOnLoad();
    initTVPosterUntilReady();
    initHlsStream();

    initMenuOutsideClick();
    cargarSaludos();
    ocultarBotonesPlayPauseTextuales();
    initInstallPrompt();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
