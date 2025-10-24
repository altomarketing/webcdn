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
      actualizarMetadata();
      setInterval(actualizarMetadata, 5000);
 
