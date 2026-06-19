document.addEventListener("DOMContentLoaded", function() {
  // --- ELEMENTOS DEL DOM ---
  const player = document.getElementById("radioPlayer");
  const tvPlayer = document.getElementById("tvPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const equalizer = document.getElementById("equalizer");
  const subtitleEl = document.querySelector(".subtitle");
  const caratula = document.getElementById("caratulaContainer");
  const caratulaImg = document.getElementById("caratulaImg");
  const menuLateral = document.getElementById("menuLateral");
  const installBtn = document.getElementById("installBtn");

  // --- CONTROL DE REPRODUCCIÓN (AUDIO) ---
  function setIcon(state) {
    if (!playIcon) return;
    if (state === "pause") {
      playIcon.innerHTML = '<path d="M6 19h4V5H6zm8-14v14h4V5h-4z" fill="white"></path>';
    } else {
      playIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="white"></path>';
    }
  }

  window.togglePlay = function() {
    if (!player) return;
    if (player.paused) {
      player.play().catch(err => console.warn("Error al reproducir audio:", err));
      setIcon("pause");
      if (equalizer) equalizer.classList.remove("paused");
    } else {
      player.pause();
      setIcon("play");
      if (equalizer) equalizer.classList.add("paused");
    }
  };

  if (playBtn) playBtn.addEventListener("click", window.togglePlay);
  
  if (player) {
    player.addEventListener("play", () => {
      setIcon("pause");
      if (equalizer) equalizer.classList.remove("paused");
    });
    player.addEventListener("pause", () => {
      setIcon("play");
      if (equalizer) equalizer.classList.add("paused");
    });
    // Intento de Autoplay controlado
    player.play().catch(() => console.log("Autoplay de audio bloqueado por el navegador."));
  }

  window.playRadio = function() {
    if (player && player.paused) {
      player.play().catch(err => console.warn(err));
      setIcon("pause");
      if (equalizer) equalizer.classList.remove("paused");
    }
  };

  // --- CONTROL DE TV (VIDEO HLS) ---
  window.playTV = function() {
    if (tvPlayer) {
      // Si la librería HLS.js está disponible y el player está listo
      if (window.Hls && Hls.isSupported() && !tvPlayer.src) {
        const hls = new Hls();
        hls.loadSource(tvPlayer.dataset.src || "https://stmv6.voxtvhd.com.br/emanueltv/emanueltv/playlist.m3u8");
        hls.attachMedia(tvPlayer);
      }
      tvPlayer.play().catch(err => console.warn("Autoplay de TV bloqueado:", err));
    }
    if (player && !player.paused) {
      player.pause();
      if (equalizer) equalizer.classList.add("paused");
      setIcon("play");
    }
    const modalTv = document.getElementById("tvModal");
    if (modalTv) modalTv.style.display = "block";
  };

  window.closeTVModal = function() {
    const modal = document.getElementById("tvModal");
    if (modal) modal.style.display = "none";
    if (tvPlayer) {
      tvPlayer.pause();
      tvPlayer.currentTime = 0;
    }
  };

  window.changeVolume = function(delta) {
    if (tvPlayer) {
      let vol = tvPlayer.volume + delta;
      tvPlayer.volume = Math.max(0, Math.min(1, vol));
    }
  };

  window.toggleFullScreen = function() {
    if (!tvPlayer) return;
    if (!document.fullscreenElement) {
      if (tvPlayer.requestFullscreen) tvPlayer.requestFullscreen();
      else if (tvPlayer.webkitRequestFullscreen) tvPlayer.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  // Cierre de modal TV haciendo clic fuera
  window.addEventListener("click", function(event) {
    const modal = document.getElementById("tvModal");
    if (event.target === modal) {
      window.closeTVModal();
    }
  });

  // Manejo de carga visual diferida para el player de TV
  if (tvPlayer) {
    const placeholder = document.getElementById("tvLoadingImage");
    let videoReady = false;

    const mostrarVideo = () => {
      if (!videoReady) {
        videoReady = true;
        if (placeholder) placeholder.style.display = "none";
        tvPlayer.style.display = "block";
        tvPlayer.classList.add("tv-animacion");
      }
    };

    tvPlayer.addEventListener("loadeddata", () => setTimeout(mostrarVideo, 1000));
    setTimeout(() => { if (!videoReady) mostrarVideo(); }, 7000);
  }

  // --- METADATOS Y CARÁTULAS (ZENO.FM API) ---
  function updateMediaSession(title, imgUrl) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || "Radio Junto a Ti",
        artist: "Radio Junto a Ti - Cantos a Dios",
        artwork: [{
          src: imgUrl || "https://i.postimg.cc/LXsjTnpb/Picsart-25-06-21-23-48-39-723.png",
          sizes: "512x512",
          type: "image/png"
        }]
      });
    }
  }

  function tryYouTubeThumb(query) {
    const ytQuery = encodeURIComponent(query);
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/results?search_query=${ytQuery}`)
      .then(res => res.json())
      .then(data => {
        if (data.thumbnail_url && caratula && caratulaImg) {
          caratulaImg.src = data.thumbnail_url;
          caratula.style.display = "block";
        } else if (caratula) {
          caratula.style.display = "none";
        }
      })
      .catch(() => { if (caratula) caratula.style.display = "none"; });
  }

  function fetchArtwork(query) {
    const clean = query.replace(/ *\([^)]*\) */g, "").replace(/ - Topic/g, "").trim();
    const term = encodeURIComponent(clean);
    fetch("https://itunes.apple.com/search?term=" + term + "&limit=1")
      .then(res => res.json())
      .then(data => {
        if (data.results.length > 0 && data.results[0].artworkUrl100 && caratula && caratulaImg) {
          const img = data.results[0].artworkUrl100.replace("100x100bb", "300x300bb");
          caratulaImg.src = img;
          caratula.style.display = "block";
          
          const img512 = data.results[0].artworkUrl100.replace("100x100bb", "512x512bb");
          updateMediaSession(clean, img512);
        } else {
          tryYouTubeThumb(query);
          updateMediaSession(clean, "https://i.postimg.cc/LXsjTnpb/Picsart-25-06-21-23-48-39-723.png");
        }
      })
      .catch(() => {
        tryYouTubeThumb(query);
        updateMediaSession(query, "https://i.postimg.cc/LXsjTnpb/Picsart-25-06-21-23-48-39-723.png");
      });
  }

  if (!!window.EventSource) {
    const es = new EventSource("https://api.zeno.fm/mounts/metadata/subscribe/iozlt3picr0vv");
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const title = data?.streamTitle || "Sin título";
      if (subtitleEl) subtitleEl.innerHTML = title;
      fetchArtwork(title);
    };
  }

  // --- MENÚ LATERAL ---
  window.abrirMenu = function() {
    if (menuLateral) menuLateral.classList.add("open");
  };

  window.cerrarMenu = function() {
    if (menuLateral) menuLateral.classList.remove("open");
  };

  window.toggleSubmenuRedes = function() {
    const submenu = document.getElementById("submenu-redes");
    if (submenu) {
      submenu.style.display = submenu.style.display === "none" ? "block" : "none";
    }
  };

  document.addEventListener("click", function(event) {
    const toggle = document.querySelector(".menu-toggle");
    if (menuLateral && menuLateral.classList.contains("open") && !menuLateral.contains(event.target) && !toggle.contains(event.target)) {
      window.cerrarMenu();
    }
  });

  // --- RELOJ ---
  function actualizarReloj() {
    const reloj = document.getElementById("reloj");
    if (reloj) {
      const ahora = new Date();
      let horas = ahora.getHours();
      const minutos = ahora.getMinutes().toString().padStart(2, '0');
      const segundos = ahora.getSeconds().toString().padStart(2, '0');
      const ampm = horas >= 12 ? 'PM' : 'AM';
      horas = horas % 12;
      horas = horas ? horas : 12; 
      reloj.textContent = horas.toString().padStart(2, '0') + ':' + minutos + ':' + segundos + ' ' + ampm;
    }
  }
  setInterval(actualizarReloj, 1000);
  actualizarReloj();

  // --- GESTIÓN DE SALUDOS (LOCALSTORAGE) ---
  window.cargarSaludos = function() {
    const contenedor = document.getElementById('saludosMostrados');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    const saludos = JSON.parse(localStorage.getItem('saludosGuardados') || "[]");
    
    // Clonamos e invertimos para no mutar el original de forma destructiva
    [...saludos].reverse().forEach((saludo, index) => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin:6px 0; font-size:14px;';
      
      const p = document.createElement('span');
      p.innerHTML = `<strong>${saludo.nombre}:</strong> ${saludo.mensaje}`;
      
      const btn = document.createElement('button');
      btn.textContent = '🗑️';
      btn.style.cssText = 'margin-left:10px; border:none; background:transparent; cursor:pointer;';
      btn.onclick = () => {
        // Calcular el índice real en el array original
        const realIndex = saludos.length - 1 - index;
        saludos.splice(realIndex, 1);
        localStorage.setItem('saludosGuardados', JSON.stringify(saludos));
        div.remove();
      };
      
      div.appendChild(p);
      div.appendChild(btn);
      contenedor.appendChild(div);
    });
  };

  window.enviarSaludo = function() {
    const nombreInput = document.getElementById('nombreInput');
    const saludoInput = document.getElementById('saludoInput');
    if (!nombreInput || !saludoInput) return;

    const nombre = nombreInput.value.trim();
    const mensaje = saludoInput.value.trim();
    
    if (nombre && mensaje) {
      const saludos = JSON.parse(localStorage.getItem('saludosGuardados') || "[]");
      saludos.push({ nombre, mensaje });
      localStorage.setItem('saludosGuardados', JSON.stringify(saludos));
      
      saludoInput.value = '';
      nombreInput.value = '';
      window.cargarSaludos();
    }
  };
  window.cargarSaludos();

  // --- INSTALACIÓN PWA (App Prompt) ---
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = "block";
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          installBtn.style.display = "none";
        }
        deferredPrompt = null;
      }
    });
  }

  // --- SERVICE WORKER REGISTRATION ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log("✅ SW registrado con éxito"))
      .catch(e => console.error("❌ Error registrando SW", e));
  }
});
