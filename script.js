document.addEventListener('DOMContentLoaded', function() {

    // ====================================================================
    // GRÁFICO 1: CONSUMO SEMANAL (Line Chart - Chart.js)
    // ====================================================================
    
    const dataConsumo = {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], 
        datasets: [{
            label: 'Consumo Semanal (kWh)',
            data: [15.5, 22.1, 18.0, 16.5, 19.8, 25.2, 17.5], 
            borderColor: '#00B4D8',
            backgroundColor: 'rgba(0, 180, 216, 0.1)', 
            fill: true,
            tension: 0.4, 
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#9B59B6'
        }]
    };

    const optionsConsumo = {
        responsive: true,
        maintainAspectRatio: false, 
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'kWh', color: '#BDC3C7' },
                ticks: { color: '#BDC3C7' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#BDC3C7' },
                grid: { display: false }
            }
        },
        plugins: {
            legend: {
                labels: { color: '#ECF0F1' }
            }
        }
    };

    const ctx = document.getElementById('dailyConsumptionChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'line', 
            data: dataConsumo,
            options: optionsConsumo
        });
    }

    // ====================================================================
    // GRÁFICO 2: DISTRIBUIÇÃO DA CARGA (Barras Customizadas com Blocos)
    // ====================================================================

    const progressData = [
        { 
            id: 'progress-aquecimento', 
            value: 45, 
            blocks: 25, 
            gradient: ['#FF7E5F', '#FEB47B'], 
            shadowColor: 'rgba(255, 126, 95, 0.5)' 
        },
        { 
            id: 'progress-climatizacao', 
            value: 35, 
            blocks: 25, 
            gradient: ['#00B4D8', '#56CCF2'], 
            shadowColor: 'rgba(0, 180, 216, 0.5)'
        },
        { 
            id: 'progress-eletrodomesticos', 
            value: 20, 
            blocks: 25, 
            gradient: ['#9B59B6', '#D0A7E3'], 
            shadowColor: 'rgba(155, 89, 182, 0.5)'
        }
    ];

    function createGradientColor(colors, index, totalActiveBlocks) {
        const startColor = colors[0];
        const endColor = colors[1];
        
        const ratio = index / (totalActiveBlocks - 1 || 1); 
        
        const r = Math.round(parseInt(startColor.slice(1,3), 16) * (1 - ratio) + parseInt(endColor.slice(1,3), 16) * ratio);
        const g = Math.round(parseInt(startColor.slice(3,5), 16) * (1 - ratio) + parseInt(endColor.slice(3,5), 16) * ratio);
        const b = Math.round(parseInt(startColor.slice(5,7), 16) * (1 - ratio) + parseInt(endColor.slice(5,7), 16) * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    }


    progressData.forEach(item => {
        const progressBarElement = document.getElementById(item.id);
        if (progressBarElement) {
            const percentage = item.value;
            const activeBlocksCount = Math.ceil((percentage / 100) * item.blocks);

            progressBarElement.innerHTML = ''; 

            for (let i = 0; i < item.blocks; i++) {
                const block = document.createElement('div');
                block.classList.add('progress-block');
                
                if (i < activeBlocksCount) {
                    block.style.backgroundColor = createGradientColor(item.gradient, i, activeBlocksCount);
                    block.style.boxShadow = `inset 0 0 5px ${item.shadowColor}`; 
                } else {
                    block.style.backgroundColor = 'transparent';
                    block.style.boxShadow = 'none';
                }
                progressBarElement.appendChild(block);
            }
        }
    });
    
    // ====================================================================
    // GRÁFICO 3: SUGESTÃO DE EFICIÊNCIA (Donut Chart)
    // ====================================================================
    
    const efficiencyValue = 38; 
    const targetValue = 100 - efficiencyValue; 

    const dataDonut = {
        datasets: [{
            data: [efficiencyValue, targetValue],
            backgroundColor: [
                '#00B4D8', 
                'rgba(155, 89, 182, 0.4)' 
            ],
            borderColor: [
                '#00B4D8',
                'transparent'
            ],
            borderWidth: 1,
            cutout: '80%', 
            borderRadius: 5
        }]
    };

    const optionsDonut = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        }
    };

    const canvasDonut = document.getElementById('efficiencyDonutChart');
    if (canvasDonut) {
        new Chart(canvasDonut.getContext('2d'), {
            type: 'doughnut',
            data: dataDonut,
            options: optionsDonut
        });
    }


});