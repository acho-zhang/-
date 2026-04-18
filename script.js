// --- 定义全局变量，预加载库和数据 ---
let csvData;
const customColors = ["#ebacb1", "#ced5e5", "#819dc5", "#ebb9c0", "#f8d5ba"]; // 珊瑚、灰蓝、紫灰等生物配色

// 1. 初始化粒子动画 (UI交互)
function initBioParticles() {
    const container = document.querySelector('.glow-cluster');
    const particleCount = 200; // 粒子数量
    
    // 生成粒子HTML
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'bio-particle';
        container.appendChild(p);
    }
    
    // 使用 Anime.js 制作图片中那个“生物发光球体簇”的动态效果
    anime({
        targets: '.bio-particle',
        // 粒子随机散落在中心周围
        translateX: () => anime.random(-150, 150),
        translateY: () => anime.random(-150, 150),
        // 随机大小，像生物细胞
        scale: () => anime.random(2, 25),
        // 随机初始透明度
        opacity: () => anime.random(0.2, 0.8),
        easing: 'easeInOutQuad',
        duration: 3000,
        // 制作持续的蠕动/呼吸效果
        delay: anime.stagger(20, {from: 'center'}),
        loop: true,
        direction: 'alternate', // 来回摆动
        update: (anim) => {
            // 这里可以添加鼠标交互，让粒子簇随鼠标轻微摆动 (UI提升)
        }
    });
}

// 2. 页面切换逻辑 (核心交互)
function initPageNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const getStartedBtn = document.getElementById('get-started');
    const homeSection = document.getElementById('home-section');
    const dataSection = document.getElementById('data-section');
    const chartContainers = document.querySelectorAll('.chart-container');
    
    // 定义一个通用的页面跳转函数
    function goToPage(targetChartId) {
        // 先隐藏所有 section
        homeSection.classList.add('hidden-section');
        homeSection.classList.remove('active-section');
        dataSection.classList.add('active-section'); // 显示数据大容器
        dataSection.classList.remove('hidden-section');
        
        // 隐藏所有 chart-container
        chartContainers.forEach(c => {
            c.classList.add('hidden-section');
            c.classList.remove('active-section');
        });
        
        // 显示目标图表
        const targetChart = document.getElementById(targetChartId);
        targetChart.classList.remove('hidden-section');
        targetChart.classList.add('active-section');
        
        // 更新导航状态
        updateNavActive(targetChartId);
    }
    
    // 更新导航 active 状态
    function updateNavActive(targetId) {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            }
        });
    }

    // 绑定点击事件：开始探索
    getStartedBtn.addEventListener('click', () => goToPage('chart-total'));
    
    // 绑定导航项点击
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            
            if(targetId === 'home') {
                // 如果是“项目介绍”，切回首页
                dataSection.classList.add('hidden-section');
                dataSection.classList.remove('active-section');
                homeSection.classList.remove('hidden-section');
                homeSection.classList.add('active-section');
                updateNavActive('home');
            } else {
                goToPage(targetId); // 切换图表
            }
        });
    });
}

// 3. D3 数据处理与绘图 (在这里粘入你之前统计好的 processedData 代码)
async function renderCharts() {
    // 3.1 加载 CSV (这里假设你已经部署或开了一个本地服务)
    try {
        const data_cleaned = await d3.csv("data.csv", d => {
            // 这里确保时间格式、字数类型都是正确的，粘入你之前的清洗代码
            // 简单演示：字数转数字
            d.字数 = +d.字数; 
            return d;
        });
        
        if(!data_cleaned.length) return; // 防止数据加载失败

        // --- 粘入你之前的 processedData 统计代码 ---
        const groups = d3.groups(data_cleaned, d => d.关系);
        const processedData = groups.map(([name, messages]) => {
            // 维度 1: 统计消息总量
            const myWords = d3.sum(messages.filter(m => m.发送者 === "我"), d => d.字数);
            const theirWords = d3.sum(messages.filter(m => m.发送者 !== "我"), d => d.字数);
            
            // 维度 2: 计算回复速度
            let totalDelay = 0;
            let count = 0;
            messages.forEach((d, i) => {
                if (i > 0 && d.发送者 === "我" && messages[i-1].发送者 !== "我") {
                    const diff = (new Date(d.timestamp) - new Date(messages[i-1].timestamp)) / 1000;
                    if (diff > 0 && diff < 86400) { totalDelay += diff; count++; }
                }
            });
            return {
                name: name,
                totalWords: myWords + theirWords,
                myWords: myWords,
                theirWords: theirWords,
                myRatio: myWords / (myWords + theirWords || 1),
                avgDelay: count > 0 ? totalDelay / count : 10800 
            };
        }).sort((a, b) => b.totalWords - a.totalWords);

        // --- 粘入你之前的 color 比例尺定义代码 ---
        const color = d3.scaleOrdinal()
            .domain(processedData.map(d => d.name))
            .range(customColors);

        // --- 定义全局 margin 等参数，粘入图表1 绘图代码 ---
        const width = document.querySelector('.d3-wrapper').offsetWidth - 40;
        const height = document.querySelector('.d3-wrapper').offsetHeight - 40;
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };

        // 3.2 绘制图表 1 (活跃度)
        const svgTotal = d3.select("#total-wrapper").append("svg").attr("viewBox", [0, 0, width, height]);
        // 粘入你之前的 renderTotal 内容
        const xT = d3.scaleBand().domain(processedData.map(d => d.name)).range([margin.left, width - margin.right]).padding(0.4);
        const yT = d3.scaleLinear().domain([0, d3.max(processedData, d => d.totalWords)]).nice().range([height - margin.bottom, margin.top]);

        svgTotal.append("g")
            .selectAll("rect").data(processedData).join("rect")
            .attr("x", d => xT(d.name)).attr("y", d => yT(d.totalWords))
            .attr("height", d => yT(0) - yT(d.totalWords)).attr("width", xT.bandwidth())
            .attr("fill", d => color(d.name))
            .attr("rx", 6)
            .append("title")
            .text(d => `${d.name}\n总字数: ${d.totalWords}\n我写了: ${d.myWords}\n对方写了: ${d.theirWords}`);
            
        svgTotal.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(xT)).selectAll("text").style("fill", "#fff");
        svgTotal.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yT).ticks(5)).selectAll("text").style("fill", "#fff");

        // 3.3 绘制图表 2 (比例)
        const svgRatio = d3.select("#ratio-wrapper").append("svg").attr("viewBox", [0, 0, width, height]);
        // 粘入你之前的 renderRatio 内容 (对方在左，我在右)
        const yR = d3.scaleBand().domain(processedData.map(d => d.name)).range([margin.top, height - margin.bottom]).padding(0.5);
        const xR = d3.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
        const rows = svgRatio.append("g").selectAll("g").data(processedData).join("g").attr("transform", d => `translate(0, ${yR(d.name)})`);
        rows.append("rect").attr("x", margin.left).attr("width", d => xR(1 - d.myRatio) - margin.left).attr("height", yR.bandwidth()).attr("fill", "#ced5e5").attr("rx", 3);
        rows.append("rect").attr("x", d => xR(1 - d.myRatio) + 2).attr("width", d => xR(1) - xR(1 - d.myRatio)).attr("height", yR.bandwidth()).attr("fill", "#ebacb1").attr("rx", 3);
        svgRatio.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yR).tickSize(0)).selectAll("text").style("fill", "#fff");

        // 3.4 绘制图表 3 (摆球)
        const svgSpeed = d3.select("#speed-wrapper").append("svg").attr("viewBox", [0, 0, width, height]);
        // 粘入你之前的 renderSpeed 内容 (同心圆)
        const centerX = width / 2, centerY = height / 3;
        const lenScale = d3.scaleLog().domain([10, d3.max(processedData, d => d.avgDelay)]).range([100, 320]);
        const pendulums = svgSpeed.append("g").selectAll("g").data(processedData).join("g").attr("transform", `translate(${centerX}, ${centerY})`);
        pendulums.append("line").attr("stroke", d => color(d.name)).attr("stroke-width", 1.5).attr("stroke-dasharray", "4,2").attr("stroke-opacity", 0.6);
        pendulums.append("circle").attr("r", d => Math.max(12, Math.log10(d.totalWords) * 7)).attr("fill", d => color(d.name)).attr("stroke", "#fff").attr("stroke-width", 2);
        pendulums.append("text").attr("dy", "-1.8em").attr("text-anchor", "middle").style("font-size", "14px").attr("fill", "#fff").text(d => d.name);

        d3.timer(elapsed => {
            pendulums.each(function(d, i) {
                const r = lenScale(d.avgDelay), speed = 0.003 * Math.sqrt(100 / r); 
                const angle = (Math.PI / 2.5) * Math.sin(elapsed * speed + i * 0.6);
                const x = r * Math.sin(angle), y = r * Math.cos(angle);
                const node = d3.select(this);
                node.select("line").attr("x2", x).attr("y2", y);
                node.select("circle").attr("cx", x).attr("cy", y);
                node.select("text").attr("x", x).attr("y", y);
            });
        });

    } catch (error) {
        console.error("加载数据或渲染图表时出错:", error);
        // 这里可以显示一个“加载失败”的UI提示
    }
}

// 4. 页面初始化
initBioParticles();
initPageNavigation();
renderCharts(); // 开始加载并绘图