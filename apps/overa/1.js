<script>
      let indice = 0;
      const imagenes = document.querySelectorAll('.slider img');
      const audioPlayer = document.getElementById('audioPlayer');
      const playBtn = document.getElementById('playBtn');
      if (imagenes.length > 0) {
        function aplicarAnimacion(img) {
          const anim = img.getAttribute('data-anim');
          img.style.animation = anim + ' 3s ease-in-out forwards';
        }
        aplicarAnimacion(imagenes[indice]);
        setInterval(() => {
          imagenes[indice].classList.remove('activa');
          indice = (indice + 1) % imagenes.length;
          imagenes[indice].classList.add('activa');
          aplicarAnimacion(imagenes[indice]);
        }, 3000);
      }
      let isPlaying = false;
      playBtn.addEventListener('click', () => {
        if (isPlaying) {
          audioPlayer.pause();
          playBtn.style.background = '#000000';
          isPlaying = false;
          playBtn.innerHTML = ' < svg viewBox = "0 0 64 64" > < polygon points = "16,12 56,32 16,52" / > < /svg>';
        } else {
          audioPlayer.play();
          playBtn.style.background = '#009900';
          isPlaying = true;
          playBtn.innerHTML = ' < svg viewBox = "0 0 64 64" > < rect x = "16"
          y = "12"
          width = "10"
          height = "40" / > < rect x = "38"
          y = "12"
          width = "10"
          height = "40" / > < /svg>';
        }
      });
    </script>
