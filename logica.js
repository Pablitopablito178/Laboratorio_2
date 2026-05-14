const canvas = document.getElementById('simuladorCanvas');
const ctx = canvas.getContext('2d');

// 1. ESTADO INICIAL AJUSTADO
let m1 = 0, m2 = 0, uk = 0, tieneFriccion = false;
let aceleracion = 0, velocidad = 0;
let posX1 = 100; 
let posY2 = 350; // Posición inicial del bloque 2 más abajo (320 + margen)
let animando = false;
const GRAVEDAD = 9.8;

const inputM1 = document.getElementById('masa1');
const inputM2 = document.getElementById('masa2');
const inputUk = document.querySelector('input[type="range"]');
const checkFriccion = document.querySelector('.switch input');
const btnCalcular = document.querySelector('.btn-primary');
const displayUk = document.querySelector('.value-display');

inputUk.addEventListener('input', () => {
    displayUk.textContent = inputUk.value;
});

function calcularFisica() {
    m1 = parseFloat(inputM1.value) || 0;
    m2 = parseFloat(inputM2.value) || 0;
    uk = parseFloat(inputUk.value);
    tieneFriccion = checkFriccion.checked;

    if (isNaN(m1) || isNaN(m2) || m1 <= 0 || m2 <= 0) {
        Swal.fire({
            title: '¡Datos incompletos!',
            text: 'Por favor, ingresa valores válidos para las masas.',
            icon: 'error',
            confirmButtonColor: '#069c88',
            background: '#1e293b',
            color: '#ffffff'
        });
        return false;
    }

    const p1 = m1 * GRAVEDAD;
    const p2 = m2 * GRAVEDAD;
    const ff = tieneFriccion ? (p1 * uk) : 0;

    let aceleracionCalculada = (p2 - ff) / (m1 + m2);
    const tension = m2 * (GRAVEDAD - aceleracionCalculada);

    document.getElementById('res-a').textContent = aceleracionCalculada.toFixed(2);
    document.getElementById('res-t').textContent = tension.toFixed(2);
    document.getElementById('res-f').textContent = ff.toFixed(2);

    // 2. REINICIO SI LA ACELERACIÓN ES NEGATIVA
    if (aceleracionCalculada <= 0) {
        aceleracion = 0;
        velocidad = 0;
        posX1 = 100;
        posY2 = 350; // Reinicia a la posición baja inicial
        animando = false;
        
        Swal.fire({
            title: 'Sistema Inmóvil',
            text: `La aceleración calculada es ${aceleracionCalculada.toFixed(2)} m/s². Al ser negativa o cero, la fricción impide el movimiento.`,
            icon: 'info',
            confirmButtonColor: '#069c88',
            background: '#1e293b',
            color: '#ffffff'
        });
        return false;
    }

    aceleracion = aceleracionCalculada;
    document.getElementById('txt-m1').textContent = m1 + " kg";
    document.getElementById('txt-m2').textContent = m2 + " kg";
    if(tieneFriccion) document.getElementById('txt-uk').textContent = uk;
    else document.getElementById('txt-uk').textContent = 0;

    return true;
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const mesaY = 300;
    const finMesaX = 500;
    const bloqueTam = 50;
    const medio = bloqueTam / 2; // 25px

    const centroB1x = posX1 + medio;
    const centroB1y = mesaY - medio;
    const centroB2x = finMesaX + 15;
    const centroB2y = posY2 + medio;

    // --- 1. ESCENARIO ---
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, mesaY, finMesaX, 10);
    
    ctx.beginPath();
    ctx.arc(finMesaX, mesaY, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.moveTo(posX1 + bloqueTam, centroB1y); 
    ctx.lineTo(finMesaX, mesaY - 15); 
    ctx.lineTo(finMesaX + 15, posY2); 
    ctx.stroke();

    // --- 2. BLOQUES ---
    ctx.fillStyle = "#069c88"; 
    ctx.fillRect(posX1, mesaY - bloqueTam, bloqueTam, bloqueTam);
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.fillText("m1", posX1 + 18, mesaY - 18);
        
    ctx.fillStyle = "#2dd4bf"; 
    ctx.fillRect(finMesaX + 15 - medio, posY2, bloqueTam, bloqueTam);
    ctx.fillStyle = "#0f172a"; 
    ctx.font = "bold 14px Arial";
    ctx.fillText("m2", finMesaX + 7, posY2 + 32);

    // --- 3. DCL (VECTORES DESDE LOS BORDES) ---
    if (animando || aceleracion !== 0 || m1 > 0) {
        ctx.font = "bold 12px Arial";

        // --- DCL BLOQUE 1 ---
        // Tensión (Desde el borde derecho)
        dibujarVector(centroB1x + medio, centroB1y, centroB1x + medio + 40, centroB1y, "#fbbf24", "T");
        // Normal (Desde el borde superior)
        dibujarVector(centroB1x, centroB1y - medio, centroB1x, centroB1y - medio - 40, "#818cf8", "N");
        // Peso 1 (Desde el borde inferior)
        dibujarVector(centroB1x, centroB1y + medio, centroB1x, centroB1y + medio + 40, "#ef4444", "W1");
        // Fricción (Desde el borde izquierdo)
        if (tieneFriccion) {
            dibujarVector(centroB1x - medio, centroB1y, centroB1x - medio - 40, centroB1y, "#f87171", "Fr");
        }

        // --- DCL BLOQUE 2 ---
        // Peso 2 (Desde el borde inferior)
        dibujarVector(centroB2x, centroB2y + medio, centroB2x, centroB2y + medio + 50, "#ef4444", "W2");
        // Tensión (Desde el borde superior)
        dibujarVector(centroB2x, centroB2y - medio, centroB2x, centroB2y - medio - 40, "#fbbf24", "T");
    }
}

// vectores
function dibujarVector(x1, y1, x2, y2, color, etiqueta) {
    const headlen = 10; // Tamaño de la punta de la flecha
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    // Línea principal
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Punta de la flecha
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Texto de la fuerza
    ctx.fillText(etiqueta, x2 + 5 * Math.cos(angle), y2 + 5 * Math.sin(angle));
}

function loop() {
    if (animando) {
        velocidad += aceleracion * 0.01; 
        posX1 += velocidad;
        posY2 += velocidad;

        if (posX1 + 50 >= 485 || posY2 >= 550) {
            animando = false;
        }
    }
    dibujar();
    requestAnimationFrame(loop);
}

btnCalcular.addEventListener('click', () => {
    if (calcularFisica()) {
        posX1 = 100;
        posY2 = 350; // Inicia desde un punto más bajo
        velocidad = 0;
        animando = true;
    }
});

canvas.width = 700;
canvas.height = 600;
loop();