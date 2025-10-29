// ====================================================================
// SOLUÇÃO DO FLASH DE TEMA (FOUC) - Executado imediatamente no carregamento
// ====================================================================
(function() {
    const savedTheme = localStorage.getItem('theme');
    // Aplica o atributo data-theme="light" no <html> se a preferência estiver salva
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();


// Variável global para armazenar instâncias dos gráficos Chart.js
const charts = {};


// ====================================================================
// INICIALIZAÇÃO E LÓGICA PRINCIPAL (DENTRO DE DOMContentLoaded)
// ====================================================================
document.addEventListener('DOMContentLoaded', function() {

    const htmlElement = document.documentElement; 
    const themeToggle = document.getElementById('theme-toggle');
    
    // ====================================================================
    // FUNÇÕES DE CRIAÇÃO DOS GRÁFICOS (Recriadas na troca de tema)
    // ====================================================================

    /**
     * Obtém as cores do tema atualizadas pelo CSS Custom Properties.
     */
    function getThemeColors() {
        const style = getComputedStyle(htmlElement);
        return {
            primary: style.getPropertyValue('--cor-primaria').trim(),
            acento: style.getPropertyValue('--cor-acento').trim(),
            textoPrincipal: style.getPropertyValue('--cor-texto-principal').trim(),
            textoSecundario: style.getPropertyValue('--cor-texto-secundario').trim(),
            fundoSecundario: style.getPropertyValue('--fundo-secundario').trim(),
            verde: '#2ECC71', // Cor do sucesso/positivo
            vermelho: '#E74C3C', // Cor do negativo/alerta
        };
    }
    
    // === GRÁFICO 2: FUNÇÃO CUSTOMIZADA PARA GRADIENTE ===
    /**
     * Função para calcular a cor interpolada para criar o efeito de gradiente por bloco.
     */
    function createGradientColor(colors, index, totalActiveBlocks) {
        const startColor = colors[0];
        const endColor = colors[1];
        
        // Converte hex para RGB para cálculo de interpolação
        const hexToRgb = (hex) => [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];

        const startRgb = hexToRgb(startColor);
        const endRgb = hexToRgb(endColor);
        
        const ratio = index / (totalActiveBlocks - 1 || 1); 
        
        const r = Math.round(startRgb[0] * (1 - ratio) + endRgb[0] * ratio);
        const g = Math.round(startRgb[1] * (1 - ratio) + endRgb[1] * ratio);
        const b = Math.round(startRgb[2] * (1 - ratio) + endRgb[2] * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // === GRÁFICO 2: DADOS E LÓGICA DE BARRAS CUSTOMIZADAS ===
    const progressData = [
        { 
            id: 'progress-aquecimento', 
            value: 45, 
            blocks: 25, 
            gradient: ['#FF7E5F', '#FEB47B'], // Laranja/Pêssego (Gradiente 1)
            shadowColor: 'rgba(255, 126, 95, 0.5)' 
        },
        { 
            id: 'progress-climatizacao', 
            value: 35, 
            blocks: 25, 
            gradient: ['#00B4D8', '#56CCF2'], // Ciano/Azul Claro (Gradiente 2)
            shadowColor: 'rgba(0, 180, 216, 0.5)'
        },
        { 
            id: 'progress-eletrodomesticos', 
            value: 20, 
            blocks: 25, 
            gradient: ['#9B59B6', '#D0A7E3'], // Roxo/Lilás (Gradiente 3)
            shadowColor: 'rgba(155, 89, 182, 0.5)'
        }
    ];

    /**
     * Função que cria ou recria todos os gráficos e barras customizadas.
     */
    function renderCharts() {
        const colors = getThemeColors();
        
        // 1. Destroi todas as instâncias anteriores (para recriar com novas cores)
        for (const id in charts) {
            if (charts[id]) {
                charts[id].destroy();
            }
        }
        
        // ====================================================================
        // GRÁFICO 1: CONSUMO SEMANAL (Line Chart - MONITORAMENTO)
        // ====================================================================
        const dataConsumo = {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], 
            datasets: [{
                label: 'Consumo Semanal (kWh)',
                data: [15.5, 22.1, 18.0, 16.5, 19.8, 25.2, 17.5], 
                borderColor: colors.primary,
                backgroundColor: colors.primary + '11', 
                fill: true,
                tension: 0.4, 
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: colors.acento
            }]
        };

        const optionsConsumo = {
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'kWh', color: colors.textoSecundario },
                    ticks: { color: colors.textoSecundario },
                    grid: { color: colors.textoSecundario + '22' } 
                },
                x: {
                    ticks: { color: colors.textoSecundario },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: colors.textoPrincipal } }
            }
        };

        const ctx1 = document.getElementById('dailyConsumptionChart');
        if (ctx1) {
            charts.dailyConsumptionChart = new Chart(ctx1.getContext('2d'), {
                type: 'line', 
                data: dataConsumo,
                options: optionsConsumo
            });
        }
        
        // ====================================================================
        // GRÁFICO 2: DISTRIBUIÇÃO DA CARGA (Barras Customizadas - MONITORAMENTO)
        // ====================================================================
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
                        // O bloco inativo usa a cor do fundo secundário para não desaparecer no light theme
                        block.style.backgroundColor = colors.fundoSecundario + '44'; 
                        block.style.boxShadow = 'none';
                    }
                    progressBarElement.appendChild(block);
                }
            }
        });
        
        // ====================================================================
        // GRÁFICO 3: SUGESTÃO DE EFICIÊNCIA (Donut Chart - MONITORAMENTO)
        // ====================================================================
        const efficiencyValue = 38; 
        const dataDonut = {
            datasets: [{
                data: [efficiencyValue, 100 - efficiencyValue],
                backgroundColor: [colors.verde, colors.acento + '44'], 
                borderColor: [colors.verde, 'transparent'],
                borderWidth: 1,
                cutout: '80%', 
                borderRadius: 5
            }]
        };

        const optionsDonut = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        };

        const ctx3 = document.getElementById('efficiencyDonutChart');
        if (ctx3) {
             charts.efficiencyDonutChart = new Chart(ctx3.getContext('2d'), {
                type: 'doughnut',
                data: dataDonut,
                options: optionsDonut
            });
        }
        
        // ====================================================================
        // GRÁFICO 4: PROGRESSO DA META (Donut Chart - CUSTOS E METAS)
        // ====================================================================
        const goalProgressValue = 72; 
        const dataGoalDonut = {
            datasets: [{
                data: [goalProgressValue, 100 - goalProgressValue],
                backgroundColor: [colors.verde, colors.acento + '44'], 
                borderColor: [colors.verde, 'transparent'],
                borderWidth: 1,
                cutout: '80%', 
                borderRadius: 5
            }]
        };

        const optionsGoalDonut = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        };

        const ctx4 = document.getElementById('goalProgressDonut');
        if (ctx4) {
             charts.goalProgressDonut = new Chart(ctx4.getContext('2d'), {
                type: 'doughnut',
                data: dataGoalDonut,
                options: optionsGoalDonut
            });
        }

        // ====================================================================
        // GRÁFICO 5: CUSTO HISTÓRICO MENSAL (Line Chart com Target Line - CUSTOS E METAS)
        // ====================================================================
        const dataMonthlyCost = {
            labels: ['Maio', 'Jun', 'Jul', 'Ago', 'Set', 'Out'], 
            datasets: [{
                label: 'Custo Mensal (R$)',
                data: [250, 280, 310, 290, 340, 325], 
                type: 'line',
                fill: true,
                tension: 0.3,
                borderColor: colors.primary, 
                backgroundColor: colors.primary + '22', 
                pointRadius: 5,
                order: 2 
            },
            {
                label: 'Meta (R$ 300)',
                data: [300, 300, 300, 300, 300, 300], 
                type: 'line',
                borderColor: colors.acento, 
                borderWidth: 2,
                borderDash: [5, 5], 
                pointRadius: 0, 
                order: 1 
            }]
        };

        const optionsMonthlyCost = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Reais (R$)', color: colors.textoSecundario },
                    ticks: { color: colors.textoSecundario },
                    grid: { color: colors.textoSecundario + '22' }
                },
                x: {
                    ticks: { color: colors.textoSecundario },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { 
                    labels: {
                        color: colors.textoPrincipal
                    }
                }
            }
        };

        const ctx5 = document.getElementById('monthlyCostBarChart');
        if (ctx5) {
             charts.monthlyCostBarChart = new Chart(ctx5.getContext('2d'), {
                type: 'line',
                data: dataMonthlyCost,
                options: optionsMonthlyCost
            });
        }
        
        // ====================================================================
        // GRÁFICO 6: DESEMPENHO DOS DISPOSITIVOS (Radar Chart - EFICIÊNCIA)
        // ====================================================================
        
        const dataRadar = {
            labels: ['Cozinha', 'Sala de Estar', 'Climatização', 'Iluminação', 'Standby'],
            datasets: [{
                label: 'Desempenho Atual',
                data: [75, 80, 65, 90, 55], // 100 é o ideal, 0 é o pior
                backgroundColor: colors.primary + '33', // Cor primária suave
                borderColor: colors.primary,
                pointBackgroundColor: colors.primary,
                pointBorderColor: colors.fundoSecundario,
                pointHoverBackgroundColor: colors.textoPrincipal,
                pointHoverBorderColor: colors.primary
            }, {
                label: 'Meta Ideal',
                data: [90, 90, 85, 95, 80],
                backgroundColor: colors.acento + '11', // Cor de acento suave
                borderColor: colors.acento,
                pointBackgroundColor: colors.acento,
                pointBorderColor: colors.fundoSecundario,
                pointHoverBackgroundColor: colors.textoPrincipal,
                pointHoverBorderColor: colors.acento
            }]
        };

        const optionsRadar = {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            scales: {
                r: {
                    angleLines: { color: colors.textoSecundario + '44' },
                    grid: { color: colors.textoSecundario + '22' },
                    pointLabels: { color: colors.textoPrincipal, font: { size: 12 } },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: { 
                        backdropColor: colors.fundoSecundario,
                        color: colors.textoSecundario // Cor dos números dos eixos
                    } 
                }
            },
            plugins: {
                legend: { 
                    labels: { color: colors.textoPrincipal }
                }
            }
        };

        const canvasRadar = document.getElementById('devicePerformanceRadar');
        if (canvasRadar) {
            charts.devicePerformanceRadar = new Chart(canvasRadar.getContext('2d'), {
                type: 'radar',
                data: dataRadar,
                options: optionsRadar
            });
        }
    }


    // ====================================================================
    // LÓGICA DE TROCA DE TEMA E EVENT LISTENERS
    // ====================================================================
    
    function applyTheme(theme) {
        if (theme === 'light') {
            htmlElement.setAttribute('data-theme', 'light');
        } else {
            htmlElement.removeAttribute('data-theme');
        }
    }

    function toggleTheme() {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Recria os gráficos para aplicar as novas cores do tema.
        setTimeout(renderCharts, 10);
    }

    // Aplica o listener de clique ao ícone da lâmpada
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // LÓGICA DE NAVEGAÇÃO DO BOTÃO PRINCIPAL (HOME)
    const primaryButton = document.querySelector('.primary-action-button');

    if (primaryButton) {
        primaryButton.addEventListener('click', function() {
            window.location.href = 'monitoramento.html';
        });
    }

    // ====================================================================
    // CONFIGURAÇÃO DO SCROLLREVEAL
    // ====================================================================
    if (typeof ScrollReveal !== 'undefined') {
        const defaultProps = {
            distance: '50px',
            duration: 1000,
            easing: 'cubic-bezier(.17, .67, .83, .67)',
            origin: 'top',
            reset: false 
        };
        
        ScrollReveal().reveal('.content-header-title', { ...defaultProps, origin: 'top' });
        ScrollReveal().reveal('.first-row-widgets .widget', { ...defaultProps, interval: 100, origin: 'left' });
        ScrollReveal().reveal('.widget-row:nth-child(n+2) .widget', { ...defaultProps, interval: 150, origin: 'bottom' });
    }

    // ====================================================================
    // INICIALIZAÇÃO CORRIGIDA - CHAMA renderCharts() se qualquer elemento 
    //                         de visualização estiver na página.
    // ====================================================================
    if (document.getElementById('dailyConsumptionChart') || 
        document.getElementById('goalProgressDonut') ||
        document.getElementById('devicePerformanceRadar') || 
        document.getElementById('progress-aquecimento')) {
        renderCharts();
    }
});