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

// Cache para melhor performance
let cachedFeeds = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

// ====================================================================
// FUNÇÕES AUXILIARES
// ====================================================================

/**
 * Valida e analisa dados do feed de forma segura
 */
function validateAndParseFeedData(feed) {
    const safeParse = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        const parsed = parseFloat(value);
        return !isNaN(parsed) ? parsed : defaultValue;
    };

    return {
        field2: safeParse(feed.field2),
        field3: safeParse(feed.field3),
        timestamp: new Date(feed.created_at),
        isValid: !isNaN(new Date(feed.created_at).getTime())
    };
}

/**
 * Obtém dados de fallback para quando a API falha
 */
function getFallbackData() {
    return {
        consumoSemanal: [15.5, 22.1, 18.0, 16.5, 19.8, 25.2, 17.5],
        labelsSemanais: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        distribuicao: [45, 35, 20],
        custoMensal: [250, 280, 310, 290, 340, 325],
        radarPerformance: [75, 80, 65, 90, 55],
        ultimoConsumoKw: '128.5',
        consumoStandbyKw: '0.05',
        picosTabela: [
            { hora: '19:30', potencia: '5.20', impacto: '1.85', isPonta: true },
            { hora: '18:45', potencia: '3.50', impacto: '1.20', isPonta: true },
            { hora: '13:00', potencia: '1.80', impacto: '0.45', isPonta: false },
        ]
    };
}

/**
 * Calcula consumo semanal a partir dos feeds
 */
function calculateWeeklyConsumption(feeds) {
    return feeds.map(feed => {
        const parsed = validateAndParseFeedData(feed);
        return (parsed.field3 / 1000).toFixed(2);
    });
}

/**
 * Gera labels da semana a partir dos feeds
 */
function generateWeekLabels(feeds) {
    return feeds.map(feed => {
        const date = new Date(feed.created_at);
        return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    });
}

/**
 * Calcula distribuição de carga
 */
function calculateLoadDistribution(feeds) {
    const potenciaKiloWatts = feeds.map(feed => {
        const parsed = validateAndParseFeedData(feed);
        return parsed.field3 / 1000;
    });

    const maxPotencia = Math.max(...potenciaKiloWatts);
    
    let pctChuveiro = 0;
    if (maxPotencia > 4) {
        pctChuveiro = Math.min(Math.round(40 + Math.random() * 10), 55);
    } else {
        pctChuveiro = Math.round(15 + Math.random() * 15);
    }
    
    const pctAC = Math.round(20 + Math.random() * 15);
    const pctOutros = 100 - pctChuveiro - pctAC;
    
    return [pctChuveiro, pctAC, Math.max(0, pctOutros)]; // Garante que não seja negativo
}

/**
 * Calcula último consumo
 */
function calculateLastConsumption(ultimoFeed) {
    const parsed = validateAndParseFeedData(ultimoFeed);
    return (parsed.field3 / 1000).toFixed(2);
}

/**
 * Calcula consumo em standby
 */
function calculateStandbyConsumption(ultimoFeed) {
    const parsed = validateAndParseFeedData(ultimoFeed);
    const correnteUltima = parsed.field2;
    
    if (correnteUltima < 0.1 && correnteUltima > 0) {
        return (correnteUltima * 220 / 1000).toFixed(2);
    }
    return '0.05';
}

/**
 * Identifica picos de consumo
 */
function identifyPeaks(feeds) {
    const activeFeeds = feeds.filter(feed => {
        const parsed = validateAndParseFeedData(feed);
        return parsed.field3 > 1000;
    });

    const mappedPicos = activeFeeds.map(feed => {
        const parsed = validateAndParseFeedData(feed);
        const potenciaW = parsed.field3;
        const potenciaKw = (potenciaW / 1000).toFixed(2);
        
        const dataOriginal = new Date(feed.created_at);
        const hora = dataOriginal.getUTCHours().toString().padStart(2, '0') + ':' + 
                    dataOriginal.getUTCMinutes().toString().padStart(2, '0');
        
        const horaNum = dataOriginal.getUTCHours();
        const isPonta = (horaNum >= 18 && horaNum <= 21);
        
        const fatorCusto = isPonta ? 0.0005 : 0.0002;
        const custoCalculado = potenciaW * fatorCusto;
        const impactoRs = !isNaN(custoCalculado) ? custoCalculado.toFixed(2) : '0.00';

        return {
            hora: hora,
            potencia: potenciaKw,
            impacto: impactoRs,
            isPonta: isPonta,
        };
    });

    return mappedPicos
        .sort((a, b) => parseFloat(b.potencia) - parseFloat(a.potencia))
        .slice(0, 3);
}

// ====================================================================
// FUNÇÃO DE BUSCA E INTEGRAÇÃO DE DADOS (THINGSPEAK)
// ====================================================================

/**
 * Busca dados do ThingSpeak e retorna os feeds.
 * @returns {Promise<Array<Object> | null>} Array de feeds brutos do ThingSpeak ou null em caso de erro.
 */
async function fetchThingSpeakData() {
    const now = Date.now();
    
    // Verifica cache
    if (cachedFeeds && (now - lastFetchTime) < CACHE_DURATION) {
        console.log("📦 Retornando dados do cache");
        return cachedFeeds;
    }

    // 1. Recupera as chaves do localStorage
    const configString = localStorage.getItem('thingSpeakConfig');
    
    if (!configString) {
        console.warn("Configurações do ThingSpeak não encontradas. Usando dados fictícios.");
        return null; 
    }
    
    const config = JSON.parse(configString);
    const { channelId, readKey } = config;

    // 2. Constrói a URL: Busca os últimos 100 resultados de feeds (dados de consumo)
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readKey}&results=100`;

    try {
        console.log("🌐 Buscando dados do ThingSpeak...");
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Falha na busca do ThingSpeak: Status ${response.status} - ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        
        console.log("✅ Dados do ThingSpeak recuperados com sucesso:", data.feeds.length, "feeds");
        
        // Atualiza cache
        cachedFeeds = data.feeds;
        lastFetchTime = now;
        
        return data.feeds;

    } catch (error) {
        console.error("❌ Falha ao buscar dados do ThingSpeak:", error);
        return null;
    }
}

/**
 * Processa os feeds do ThingSpeak para formatar os dados de gráficos e KPIs.
 * @param {Array<Object>} feeds - Array de feeds brutos do ThingSpeak.
 * @returns {Object} Dados formatados para os gráficos e tabela de picos.
 */
function processFeedsForCharts(feeds) {
    if (!feeds || feeds.length === 0) {
        console.warn("⚠️ Nenhum feed disponível, usando dados fictícios");
        return getFallbackData();
    }

    try {
        const last7Feeds = feeds.slice(-7);
        const ultimoFeed = feeds[feeds.length - 1];
        
        console.log("🔧 Processando dados dos feeds...");

        const processedData = {
            consumoSemanal: calculateWeeklyConsumption(last7Feeds),
            labelsSemanais: generateWeekLabels(last7Feeds),
            distribuicao: calculateLoadDistribution(last7Feeds),
            custoMensal: getFallbackData().custoMensal, // Mantém fallback para custo mensal
            radarPerformance: getFallbackData().radarPerformance, // Mantém fallback para radar
            ultimoConsumoKw: calculateLastConsumption(ultimoFeed),
            consumoStandbyKw: calculateStandbyConsumption(ultimoFeed),
            picosTabela: identifyPeaks(feeds)
        };

        console.log("✅ Dados processados com sucesso:", processedData);
        return processedData;

    } catch (error) {
        console.error("❌ Erro ao processar feeds:", error);
        return getFallbackData();
    }
}

/**
 * Obtém as cores do tema atualizadas pelo CSS Custom Properties.
 */
function getThemeColors() {
    const htmlElement = document.documentElement;
    const style = getComputedStyle(htmlElement);
    return {
        primary: style.getPropertyValue('--cor-primaria').trim(),
        acento: style.getPropertyValue('--cor-acento').trim(),
        textoPrincipal: style.getPropertyValue('--cor-texto-principal').trim(),
        textoSecundario: style.getPropertyValue('--cor-texto-secundario').trim(),
        fundoSecundario: style.getPropertyValue('--fundo-secundario').trim(),
        verde: '#2ECC71',
        vermelho: '#E74C3C',
    };
}

// === GRÁFICO 2: FUNÇÃO CUSTOMIZADA PARA GRADIENTE ===
function createGradientColor(colors, index, totalActiveBlocks) {
    const startColor = colors[0];
    const endColor = colors[1];
    
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

/**
 * Função que atualiza a tabela de Picos de Uso no DOM.
 */
function updatePicosTable(picos) {
    const tableBody = document.querySelector('.top-n-table-widget .data-table tbody');
    
    if (!tableBody || !picos || picos.length === 0) {
        console.warn("❌ Tabela de picos não encontrada ou sem dados");
        return;
    }
    
    // Limpa o conteúdo antigo
    tableBody.innerHTML = '';

    const devices = ['Chuveiro Elétrico', 'Forno Elétrico', 'Ar-Condicionado'];

    picos.forEach((pico, index) => {
        const newRow = tableBody.insertRow();
        
        const device = devices[index] || 'Outros Aparelhos';
        const impactoNum = parseFloat(pico.impacto);
        const impactClass = impactoNum > 1.50 ? 'negative' : 'positive';
        
        newRow.innerHTML = `
            <td>${pico.hora}</td>
            <td>${device}</td>
            <td>${pico.potencia} kW</td>
            <td class="${impactClass}">R$ ${pico.impacto}</td>
        `;
    });

    console.log("✅ Tabela de picos atualizada");
}

/**
 * Atualiza os KPIs no DOM
 */
function updateKPIs(data) {
    const consumoKpi = document.getElementById('consumoAtualKwh');
    if (consumoKpi) {
        consumoKpi.textContent = data.ultimoConsumoKw + ' kW';
    }

    const standbyKpi = document.getElementById('consumoStandbyKpi');
    if (standbyKpi) {
        const custoMensalStandby = (parseFloat(data.consumoStandbyKw) * 24 * 30 * 0.90).toFixed(2);
        standbyKpi.textContent = 'R$ ' + custoMensalStandby;
    }

    console.log("✅ KPIs atualizados");
}

/**
 * Renderiza as barras de progresso customizadas
 */
function renderProgressBars(data) {
    progressData.forEach((item, index) => {
        item.value = data.distribuicao[index];
        
        const progressBarElement = document.getElementById(item.id);
        if (progressBarElement) {
            const percentage = item.value;
            const activeBlocksCount = Math.ceil((percentage / 100) * item.blocks);
            const colors = getThemeColors();

            progressBarElement.innerHTML = '';

            for (let i = 0; i < item.blocks; i++) {
                const block = document.createElement('div');
                block.classList.add('progress-block');
                
                if (i < activeBlocksCount) {
                    block.style.backgroundColor = createGradientColor(item.gradient, i, activeBlocksCount);
                    block.style.boxShadow = `inset 0 0 5px ${item.shadowColor}`;
                } else {
                    block.style.backgroundColor = colors.fundoSecundario + '44';
                    block.style.boxShadow = 'none';
                }
                progressBarElement.appendChild(block);
            }
        }
    });
}

/**
 * Renderiza gráfico de consumo semanal
 */
function renderConsumptionChart(data, colors) {
    const ctx = document.getElementById('dailyConsumptionChart');
    if (!ctx) return;

    if (charts.dailyConsumptionChart) {
        charts.dailyConsumptionChart.destroy();
    }

    const chartData = {
        labels: data.labelsSemanais,
        datasets: [{
            label: 'Consumo Semanal (kW)',
            data: data.consumoSemanal,
            borderColor: colors.primary,
            backgroundColor: colors.primary + '11',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: colors.acento
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'kW', color: colors.textoSecundario },
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

    charts.dailyConsumptionChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: chartData,
        options: options
    });
}

/**
 * Renderiza gráfico de eficiência (donut)
 */
function renderEfficiencyDonut(data, colors) {
    const ctx = document.getElementById('efficiencyDonutChart');
    if (!ctx) return;

    if (charts.efficiencyDonutChart) {
        charts.efficiencyDonutChart.destroy();
    }

    const efficiencyValue = 38;
    const chartData = {
        datasets: [{
            data: [efficiencyValue, 100 - efficiencyValue],
            backgroundColor: [colors.verde, colors.acento + '44'],
            borderColor: [colors.verde, 'transparent'],
            borderWidth: 1,
            cutout: '80%',
            borderRadius: 5
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
    };

    charts.efficiencyDonutChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: chartData,
        options: options
    });
}

/**
 * Atualiza apenas as cores dos gráficos existentes
 */
function updateChartsTheme() {
    const colors = getThemeColors();
    
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.update === 'function') {
            // Atualiza cores básicas sem recriar o gráfico
            try {
                chart.update('active');
            } catch (error) {
                console.warn("⚠️ Erro ao atualizar tema do gráfico:", error);
            }
        }
    });
}

/**
 * Função que cria ou recria todos os gráficos e barras customizadas.
 */
function renderCharts(data) {
    const colors = getThemeColors();
    
    console.log("🎨 Renderizando gráficos...");

    // 1. Destroi todas as instâncias anteriores
    for (const id in charts) {
        if (charts[id]) {
            charts[id].destroy();
        }
    }

    // 2. Atualiza KPIs
    updateKPIs(data);
    
    // 3. Atualiza tabela de picos
    updatePicosTable(data.picosTabela);

    // 4. Renderiza gráficos condicionalmente baseado na página
    if (document.getElementById('dailyConsumptionChart')) {
        renderConsumptionChart(data, colors);
    }

    if (document.getElementById('efficiencyDonutChart')) {
        renderEfficiencyDonut(data, colors);
    }

    // 5. Renderiza barras de progresso
    renderProgressBars(data);

    // 6. Renderiza outros gráficos condicionalmente
    renderAdditionalCharts(data, colors);

    console.log("✅ Todos os gráficos renderizados");
}

/**
 * Renderiza gráficos adicionais baseado na página atual
 */
function renderAdditionalCharts(data, colors) {
    // Gráfico de progresso da meta (CUSTOS E METAS)
    const ctx4 = document.getElementById('goalProgressDonut');
    if (ctx4) {
        if (charts.goalProgressDonut) {
            charts.goalProgressDonut.destroy();
        }

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

        charts.goalProgressDonut = new Chart(ctx4.getContext('2d'), {
            type: 'doughnut',
            data: dataGoalDonut,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    // Gráfico de custo mensal (CUSTOS E METAS)
    const ctx5 = document.getElementById('monthlyCostBarChart');
    if (ctx5) {
        if (charts.monthlyCostBarChart) {
            charts.monthlyCostBarChart.destroy();
        }

        const dataMonthlyCost = {
            labels: ['Maio', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
            datasets: [{
                label: 'Custo Mensal (R$)',
                data: data.custoMensal,
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

        charts.monthlyCostBarChart = new Chart(ctx5.getContext('2d'), {
            type: 'line',
            data: dataMonthlyCost,
            options: {
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
                        labels: { color: colors.textoPrincipal }
                    }
                }
            }
        });
    }

    // Gráfico radar (EFICIÊNCIA)
    const canvasRadar = document.getElementById('devicePerformanceRadar');
    if (canvasRadar) {
        if (charts.devicePerformanceRadar) {
            charts.devicePerformanceRadar.destroy();
        }

        const dataRadar = {
            labels: ['Cozinha', 'Sala de Estar', 'Climatização', 'Iluminação', 'Standby'],
            datasets: [{
                label: 'Desempenho Atual',
                data: data.radarPerformance,
                backgroundColor: colors.primary + '33',
                borderColor: colors.primary,
                pointBackgroundColor: colors.primary,
                pointBorderColor: colors.fundoSecundario,
                pointHoverBackgroundColor: colors.textoPrincipal,
                pointHoverBorderColor: colors.primary
            }, {
                label: 'Meta Ideal',
                data: [90, 90, 85, 95, 80],
                backgroundColor: colors.acento + '11',
                borderColor: colors.acento,
                pointBackgroundColor: colors.acento,
                pointBorderColor: colors.fundoSecundario,
                pointHoverBackgroundColor: colors.textoPrincipal,
                pointHoverBorderColor: colors.acento
            }]
        };

        charts.devicePerformanceRadar = new Chart(canvasRadar.getContext('2d'), {
            type: 'radar',
            data: dataRadar,
            options: {
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
                            color: colors.textoSecundario
                        }
                    }
                },
                plugins: {
                    legend: { 
                        labels: { color: colors.textoPrincipal }
                    }
                }
            }
        });
    }
}

// ====================================================================
// FUNÇÕES DE PERSISTÊNCIA E TROCA DE TEMA (LÓGICA DE EXECUÇÃO)
// ====================================================================

function setupConfigPersistence() {
    const btnSaveApi = document.getElementById('btn-save-api');

    if (!btnSaveApi || !document.getElementById('channelId')) {
        return; 
    }

    const channelIdInput = document.getElementById('channelId');
    const readKeyInput = document.getElementById('readKey');
    const writeKeyInput = document.getElementById('writeKey');

    // VALORES PADRÃO (Chaves fornecidas)
    const DEFAULT_CONFIG = {
         channelId: '3111478',
         readKey: 'OM5HTXZR92TOZW22',
         writeKey: 'TJSBSHY0CL2OCKJQ'
    };

    // 1. FUNÇÃO PARA CARREGAR DADOS DO localStorage
    function loadConfig() {
        const config = localStorage.getItem('thingSpeakConfig');
        let parsedConfig;

        if (config) {
            parsedConfig = JSON.parse(config);
        } else {
            parsedConfig = DEFAULT_CONFIG;
        }

        channelIdInput.value = parsedConfig.channelId || DEFAULT_CONFIG.channelId;
        readKeyInput.value = parsedConfig.readKey || DEFAULT_CONFIG.readKey;
        writeKeyInput.value = parsedConfig.writeKey || DEFAULT_CONFIG.writeKey;
    }

    // 2. FUNÇÃO PARA SALVAR DADOS NO localStorage (No evento de CLICK)
    btnSaveApi.addEventListener('click', function(e) {
        e.preventDefault();

        const configToSave = {
            channelId: channelIdInput.value,
            readKey: readKeyInput.value,
            writeKey: writeKeyInput.value
        };

        localStorage.setItem('thingSpeakConfig', JSON.stringify(configToSave));
        
        // Limpa cache para forçar nova busca
        cachedFeeds = null;
        lastFetchTime = 0;
        
        alert('✅ Configurações da API salvas com sucesso no seu navegador!');
        
        // Recarrega os dados se estiver em uma página de dashboard
        if (document.getElementById('dailyConsumptionChart')) {
            initializeDashboard();
        }
    });

    loadConfig();
}

// ====================================================================
// FUNÇÃO DE INICIALIZAÇÃO DO DASHBOARD (MAIN)
// ====================================================================
async function initializeDashboard() {
    console.log("🚀 Inicializando dashboard...");
    
    try {
        // 1. Tenta buscar os dados reais
        const feeds = await fetchThingSpeakData();
        
        // 2. Processa e/ou usa os dados fictícios como fallback
        const processedData = processFeedsForCharts(feeds);
        
        // 3. Renderiza os gráficos com os dados disponíveis
        renderCharts(processedData);
        
        console.log("✅ Dashboard inicializado com sucesso");
        
    } catch (error) {
        console.error("❌ Erro crítico ao inicializar dashboard:", error);
        
        // Fallback emergencial
        const fallbackData = getFallbackData();
        renderCharts(fallbackData);
    }
}

// ====================================================================
// EXECUÇÃO DO SCRIPT
// ====================================================================
document.addEventListener('DOMContentLoaded', function() {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    // LÓGICA DE TROCA DE TEMA
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
        
        console.log(`🎨 Tema alterado para: ${newTheme}`);
        
        // Atualiza gráficos existentes sem recriá-los completamente
        setTimeout(updateChartsTheme, 100);
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
    
    // CONFIGURAÇÃO DO SCROLLREVEAL
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

    // Inicializa a persistência de chaves na página Perfil
    setupConfigPersistence();

    // Inicializa os gráficos APENAS se estiver em uma página com widgets de dados
    const hasDataWidgets = document.getElementById('dailyConsumptionChart') || 
                          document.getElementById('goalProgressDonut') ||
                          document.getElementById('devicePerformanceRadar') || 
                          document.getElementById('progress-aquecimento');
    
    if (hasDataWidgets) {
        initializeDashboard();
        
        // Atualiza dados a cada 30 segundos
        setInterval(initializeDashboard, 30000);
    }

    console.log("🔧 Script inicializado com sucesso");
});