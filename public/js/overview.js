document.addEventListener('DOMContentLoaded', async () => {
    // Sites scanned counter
    try {
        const scannedSitesCountRes = await fetch('/api/scannedSitesCount');
        const scannedCountData = await scannedSitesCountRes.json();
        if (scannedCountData.success) {
            animateCounter('scannedSitesCount', scannedCountData.count);
        } else {
            console.error('Failed to fetch scanned sites count');
        }
    }
    catch (error) {
        console.error('Error fetching scanned sites count:', error);
    }
    // Vulnerability counter
    try {
        const vulnerabilityCountRes = await fetch('/api/vulnerabilityCount');
        const vulnerabilityData = await vulnerabilityCountRes.json();
        if (vulnerabilityData.success) {
            animateCounter('vulnerabilityCount', vulnerabilityData.count);
        } else {
            console.error('Failed to fetch vulnerability count');
        }
    }
    catch (error) {
        console.error('Error fetching vulnerability count:', error);
    }
    // Low vulnerability counter
    try {
        const lowVulnerabilityCountRes = await fetch('/api/vulnerabilityCount/low');
        const lowVulnerabilityData = await lowVulnerabilityCountRes.json();
        if (lowVulnerabilityData.success) {
            animateCounter('lowVulnerabilityCount', lowVulnerabilityData.count);
        } else {
            console.error('Failed to fetch low vulnerability count');
        }
    }
    catch (error) {
        console.error('Error fetching low vulnerability count:', error);
    }
    // Medium vulnerability counter
    try {
        const mediumVulnerabilityCountRes = await fetch('/api/vulnerabilityCount/medium');
        const mediumVulnerabilityData = await mediumVulnerabilityCountRes.json();
        if (mediumVulnerabilityData.success) {
            animateCounter('mediumVulnerabilityCount', mediumVulnerabilityData.count);
        } else {
            console.error('Failed to fetch medium vulnerability count');
        }
    }
    catch (error) {
        console.error('Error fetching medium vulnerability count:', error);
    }
    // High vulnerability counter
    try {
        const highVulnerabilityCountRes = await fetch('/api/vulnerabilityCount/high');
        const highVulnerabilityData = await highVulnerabilityCountRes.json();
        if (highVulnerabilityData.success) {
            animateCounter('highVulnerabilityCount', highVulnerabilityData.count);
        } else {
            console.error('Failed to fetch high vulnerability count');
        }
    }
    catch (error) {
        console.error('Error fetching high vulnerability count:', error);
    }
    // Critical vulnerability counter
    try {
        const criticalVulnerabilityCountRes = await fetch('/api/vulnerabilityCount/critical');
        const criticalVulnerabilityData = await criticalVulnerabilityCountRes.json();
        if (criticalVulnerabilityData.success) {
            animateCounter('criticalVulnerabilityCount', criticalVulnerabilityData.count);
        } else {
            console.error('Failed to fetch critical vulnerability count');
        }
    }
    catch (error) {
        console.error('Error fetching critical vulnerability count:', error);
    }
    // Unkown vulnerability counter
    try {
        const unknownVulnerabilityCountRes = await fetch('/api/vulnerabilityCount/unknown');
        const unknownVulnerabilityData = await unknownVulnerabilityCountRes.json();
        if (unknownVulnerabilityData.success) {
            animateCounter('unknownVulnerabilityCount', unknownVulnerabilityData.count);
        } else {
            console.error('Failed to fetch unknown vulnerability count');
        }
    }
    catch (error) {
        console.error('Error fetching unknown vulnerability count:', error);
    }
    // Known vulnerabilities pie chart
    try {
        const knownVulnerabilitiesRes = await fetch('/api/knownVulnerabilitiesCount');
        const knownVulnerabilitiesData = await knownVulnerabilitiesRes.json();
        if (knownVulnerabilitiesData.success) {
            const chartData = {
                labels: ['XSS', 'SQLi', 'CSRF', 'LFI', 'RCE', 'Other'],
                datasets: [{
                    label: 'Known Vulnerabilities',
                    data: [
                        knownVulnerabilitiesData.xss,
                        knownVulnerabilitiesData.sqli,
                        knownVulnerabilitiesData.csrf,
                        knownVulnerabilitiesData.lfi,
                        knownVulnerabilitiesData.rce,
                        knownVulnerabilitiesData.other
                    ],
                    backgroundColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            };
            const ctx = document.getElementById('knownVulnerabilitiesChart').getContext('2d');
            const knownVulnerabilitiesChart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            // Disable the "Other" slice in the legend by default
            knownVulnerabilitiesChart.toggleDataVisibility(5);
        } else {
            console.error('Failed to fetch known vulnerabilities data');
        }
    } catch (error) {
        console.error('Error fetching known vulnerabilities data:', error);
    }
    // Vulnerability web ranking
    try {
        const vulnerabilityWebRankingRes = await fetch('/api/vulnerabilityWebRanking');
        const vulnerabilityWebRankingData = await vulnerabilityWebRankingRes.json();
        if (vulnerabilityWebRankingData.success) {
            const tableBody = document.getElementById('webRankingList');
            vulnerabilityWebRankingData.ranking.forEach((site, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td class="fw-bold">${index + 1}</td>
                <td class="link-primary"><a href="//${site._id}" target="_blank">${site._id}</a></td>
                <td>${site.count}</td>`;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Failed to fetch vulnerability web ranking');
        }
    }
    catch (error) {
        console.error('Error fetching vulnerability web ranking:', error);
    }
});

function animateCounter(id, count) {
    const element = document.getElementById(id);
    let startValue = 0;
    const duration = 2000; //milliseconds
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            startValue = Math.floor(progress * count);
            element.innerText = startValue;
            requestAnimationFrame(updateCounter);
        } else {
            element.innerText = count;
        }
    }
    requestAnimationFrame(updateCounter);
}