// app/static/world/shell/panopticon.js

const Panopticon = {
    mode: 'supra', 
    subMode: 'numero', 
    infraMode: 'nigredo', 
    rubedoViewMode: 'module', 
    timeUnit: 'day',
    chart: null,
    baseDate: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
    fpInstance: null,

    init() {
        this.bindEvents();
        this.renderControls();
        this.fetchStats();
    },

    bindEvents() {
        const toggle = document.getElementById('mode-toggle');
        if (!toggle) return;
        toggle.onclick = () => {
            this.mode = (this.mode === 'supra') ? 'infra' : 'supra';
            
            toggle.classList.toggle('active', this.mode === 'infra');
            document.getElementById('label-supra').classList.toggle('active', this.mode === 'supra');
            document.getElementById('label-infra').classList.toggle('active', this.mode === 'infra');
            
            this.renderControls();
            this.fetchStats();
        };
    },

    // 🚀 [추가]: 탭 이동 시 안전하게 날짜를 강제로 갱신하는 로직
    resetDateToMax(timeUnit) {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const d = today.getDate();
        const dayOfWeek = today.getDay(); // 0: Sun, 6: Sat

        let maxDate = today;

        // Chronos는 항상 오늘 기준 유지, 그 외 단위일 때만 과거로 스냅
        if (!(this.mode === 'supra' && this.subMode === 'chronos')) {
            if (timeUnit === 'month') {
                maxDate = new Date(y, m, 0); // 0일 = 저번 달의 마지막 날
            } else if (timeUnit === 'week') {
                maxDate = new Date(y, m, d - (dayOfWeek + 1)); // 저번 주 토요일
            }
        }
        
        const max_y = maxDate.getFullYear();
        const max_m = String(maxDate.getMonth() + 1).padStart(2, '0');
        const max_d = String(maxDate.getDate()).padStart(2, '0');
        
        this.baseDate = `${max_y}-${max_m}-${max_d}`;
    },

    createTimeControls() {
        const wrap = document.createElement('div');
        wrap.className = 'time-control-wrapper';
        
        const tabs = this.createTabGroup(['Day', 'Week', 'Month'], this.timeUnit, 'a2-style-tabs', (t) => {
            this.timeUnit = t.toLowerCase();
            this.resetDateToMax(this.timeUnit); // 🚀 탭 전환 시 기준일을 자동 이동!
            this.renderControls();
            this.fetchStats();
        });
        wrap.appendChild(tabs);
        
        const calWrap = document.createElement('div');
        calWrap.className = 'custom-calendar-wrapper';
        calWrap.style.position = 'relative'; 
        
        calWrap.innerHTML = `
            <input type="text" id="pano-hidden-picker" style="opacity:0; position:absolute; left:0; top:0; width:24px; height:24px; cursor:pointer; z-index:10;">
            <svg class="calendar-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="calendar-label" id="pano-cal-label"></span>
        `;
        wrap.appendChild(calWrap);
        
        setTimeout(() => {
            this.initFlatpickr();
        }, 0);
        
        return wrap;
    },

    initFlatpickr() {
        if (this.fpInstance) { this.fpInstance.destroy(); }
        
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const d = today.getDate();
        const dayOfWeek = today.getDay();

        let maxAllowedDate = today;
        const isChronos = (this.mode === 'supra' && this.subMode === 'chronos');

        // 🚀 달력 내 한계점(maxDate) 세팅
        if (!isChronos) {
            if (this.timeUnit === 'month') {
                maxAllowedDate = new Date(y, m, 0);
            } else if (this.timeUnit === 'week') {
                maxAllowedDate = new Date(y, m, d - (dayOfWeek + 1));
            }
        }
        
        const max_y = maxAllowedDate.getFullYear();
        const max_m = String(maxAllowedDate.getMonth() + 1).padStart(2, '0');
        const max_d = String(maxAllowedDate.getDate()).padStart(2, '0');
        const maxStr = `${max_y}-${max_m}-${max_d}`;

        let fpConfig = {
            defaultDate: this.baseDate,
            maxDate: maxStr, 
            disableMobile: true,
            onChange: (selectedDates, dateStr) => {
                if (selectedDates.length > 0) {
                    const sd = selectedDates[0];
                    const cleanDate = sd.getFullYear() + "-" + String(sd.getMonth()+1).padStart(2,'0') + "-" + String(sd.getDate()).padStart(2,'0');
                    
                    if (this.timeUnit === 'month' && !isChronos) {
                        this.baseDate = cleanDate.substring(0, 7) + "-01"; 
                    } else {
                        this.baseDate = cleanDate;
                    }
                    this.fetchStats();
                }
            }
        };

        if (!isChronos) {
            if (this.timeUnit === 'month' && window.monthSelectPlugin) {
                fpConfig.plugins = [ new monthSelectPlugin({ shorthand: true, dateFormat: "Y-m-d", theme: "light" }) ];
            } else if (this.timeUnit === 'week' && window.weekSelect) {
                fpConfig.plugins = [ new weekSelect({}) ];
            }
        }

        this.fpInstance = flatpickr('#pano-hidden-picker', fpConfig);
    },

    renderControls() {
        const container = document.getElementById('pano-controls');
        if (!container) return;
        container.innerHTML = ''; 

        if (this.mode === 'supra') {
            const mainTabs = this.createTabGroup(['Numero', 'Chronos', 'Terra', 'Routes'], this.subMode, 'custom-tab-bar', (m) => {
                this.subMode = m.toLowerCase();
                this.resetDateToMax(this.timeUnit); // 🚀 메인 탭 변경 시에도 스냅
                this.renderControls();
                this.fetchStats();
            });
            container.appendChild(mainTabs);

            if (this.subMode === 'chronos') {
                const calWrap = document.createElement('div');
                calWrap.className = 'time-control-wrapper chronos-only-wrapper';
                calWrap.style.position = 'relative';
                calWrap.innerHTML = `
                    <div class="custom-calendar-wrapper" style="position:relative;">
                        <input type="text" id="pano-hidden-picker" style="opacity:0; position:absolute; left:0; top:0; width:24px; height:24px; cursor:pointer; z-index:10;">
                        <svg class="calendar-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span class="calendar-label" id="pano-cal-label"></span>
                    </div>
                `;
                container.appendChild(calWrap);
                
                setTimeout(() => {
                    this.initFlatpickr(); 
                }, 0);
            } else {
                const timeWrap = this.createTimeControls();
                container.appendChild(timeWrap);
            }
        } else {
            const timeWrap = this.createTimeControls();
            container.appendChild(timeWrap);

            const infraTabs = this.createTabGroup(['Nigredo', 'Albedo', 'Citrinitas', 'Rubedo', 'Ritual', 'Grimoire'], this.infraMode, 'custom-tab-bar', (m) => {
                this.infraMode = m.toLowerCase();
                this.renderControls();
                this.fetchStats();
            });
            container.appendChild(infraTabs);

            if (this.infraMode === 'rubedo') {
                const subSwitchWrap = document.createElement('div');
                subSwitchWrap.className = 'rubedo-switch-container';
                
                subSwitchWrap.innerHTML = `
                    <div class="dichotomy-container sub-dicho">
                        <span class="dicho-label ${this.rubedoViewMode === 'module' ? 'active' : ''}">Module</span>
                        <div class="dicho-switch ${this.rubedoViewMode === 'grimoire' ? 'active' : ''}" id="rubedo-toggle">
                            <div class="dicho-knob"></div>
                        </div>
                        <span class="dicho-label ${this.rubedoViewMode === 'grimoire' ? 'active' : ''}">Grimoire</span>
                    </div>
                `;
                container.appendChild(subSwitchWrap);

                document.getElementById('rubedo-toggle').onclick = () => {
                    this.rubedoViewMode = (this.rubedoViewMode === 'module') ? 'grimoire' : 'module';
                    this.renderControls();
                    this.fetchStats();
                };
            }
        }
    },

    createTabGroup(list, current, className, callback) {
        const group = document.createElement('div');
        group.className = className;
        const itemClass = className === 'custom-tab-bar' ? 'custom-tab-item' : 'a2-tab-btn';
        
        list.forEach(item => {
            const btn = document.createElement('div');
            btn.className = `${itemClass} ${current.toLowerCase() === item.toLowerCase() ? 'active' : ''}`;
            btn.innerText = item;
            btn.addEventListener('click', () => callback(item));
            group.appendChild(btn);
        });
        return group;
    },

    async fetchStats() {
        const targetSub = this.mode === 'supra' ? this.subMode : this.infraMode;
        
        try {
            let url = `/api/godmode/panopticon/data?mode=${this.mode}&sub_mode=${targetSub}&time_unit=${this.timeUnit}&view_mode=${this.rubedoViewMode}`;
            if (this.baseDate) {
                url += `&base_date=${this.baseDate}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Server rejected the connection.");
            const data = await res.json();
            
            if (data.error) return this.renderEmptyState(data.error);
            this.updateUI(data);
        } catch (e) {
            this.renderEmptyState("The void is silent. No data found.");
        }
    },

    updateUI(data) {
        const totalEl = document.getElementById('today-total');
        if (totalEl && data.today_total !== undefined) {
            totalEl.innerText = data.today_total;
        }

        const calLabel = document.getElementById('pano-cal-label');
        if (calLabel) {
            let labelText = data.period_label || '';
            if (data.update_time && this.timeUnit === 'day' && this.mode === 'infra') {
                labelText += ` <span class="update-time">As of ${data.update_time}</span>`;
            }
            calLabel.innerHTML = labelText;
        }

        const chartWrapper = document.querySelector('.chart-wrapper');
        let terraEl = document.getElementById('terra-container');
        if (!terraEl) {
            terraEl = document.createElement('div');
            terraEl.id = 'terra-container';
            terraEl.className = 'terra-wrapper';
            document.querySelector('.chart-section').appendChild(terraEl);
        }

        if (data.terra_mode || data.routes_mode) {
            if (this.chart) { this.chart.destroy(); this.chart = null; }
            if (chartWrapper) chartWrapper.style.display = 'none';
            terraEl.style.display = 'block';
            
            const tableArea = document.getElementById('data-table-area');
            if (tableArea) tableArea.innerHTML = ''; 

            let html = ``;
            if (!data.data || data.data.length === 0) {
                html += `<div style="color:#999; text-align:center; padding: 40px;">The void is silent. No data found.</div>`;
            } else {
                data.data.forEach(item => {
                    const iconOrFlag = item.icon ? item.icon : item.flag;
                    html += `
                        <div class="terra-item">
                            <div class="terra-flag">${iconOrFlag}</div>
                            <div class="terra-info">
                                <div class="terra-name-row">
                                    <span class="terra-name"><small style="opacity:0.5; margin-right:8px;">#${item.rank}</small>${item.name}</span>
                                    <span class="terra-pct">${item.percent}%</span>
                                </div>
                                <div class="terra-count-row">
                                    <span class="terra-eye">👁️</span>
                                    <span class="terra-count">${item.count}</span>
                                </div>
                                <div class="terra-bar-bg">
                                    <div class="terra-bar-fill" style="width: ${item.percent}%"></div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            terraEl.innerHTML = html;
            return; 
        }

        if (data.infra_table_mode) {
            if (this.chart) { this.chart.destroy(); this.chart = null; }
            if (chartWrapper) chartWrapper.style.display = 'none';
            if (terraEl) terraEl.style.display = 'none'; 
            
            const tableArea = document.getElementById('data-table-area');
            if (!tableArea) return;

            const hideChronos = data.hide_chronos === true;
            let html = `
                <table class="pano-data-table">
                    <thead>
                        <tr>
                            <th class="col-infra-module">Module</th>
                            <th class="col-infra-numero">Numero</th>
                            ${!hideChronos ? '<th class="col-infra-chronos">Chronos</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.table.forEach(row => {
                html += `
                    <tr>
                        <td class="col-infra-module">${row.module}</td>
                        <td class="col-infra-numero">${row.numero}</td>
                        ${!hideChronos ? `<td class="col-infra-chronos">${row.chronos}</td>` : ''}
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            tableArea.innerHTML = html;
            return; 
        }

        if (data.rubedo_mode) {
            if (this.chart) { this.chart.destroy(); this.chart = null; }
            if (chartWrapper) chartWrapper.style.display = 'none';
            
            const tableArea = document.getElementById('data-table-area');
            if (!tableArea) return;

            const isGrimoire = data.view_mode === 'grimoire';
            let html = `
                <table class="pano-data-table rubedo-table">
                    <thead>
                        <tr>
                            <th class="col-infra-module">${isGrimoire ? 'Grimoire Item' : 'Module'}</th>
                            <th class="col-infra-numero">Numero</th>
                            ${!isGrimoire ? '<th class="col-infra-chronos">Chronos</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.table.forEach((row, idx) => {
                const hasDetail = row.has_detail && row.details && row.details.length > 0;
                html += `
                    <tr class="${hasDetail ? 'accordion-header' : ''}" onclick="${hasDetail ? `Panopticon.toggleAccordion(${idx})` : ''}">
                        <td class="col-infra-module">
                            ${hasDetail ? '<span class="acc-icon">▶</span> ' : ''}${row.module}
                        </td>
                        <td class="col-infra-numero">${row.numero}</td>
                        ${!isGrimoire ? `<td class="col-infra-chronos">${row.chronos}</td>` : ''}
                    </tr>
                `;
                
                if (hasDetail) {
                    html += `<tr id="acc-detail-${idx}" class="accordion-content" style="display:none;"><td colspan="3">
                        <div class="acc-inner-wrap">
                            ${row.details.map(d => `
                                <div class="acc-row">
                                    <span class="acc-title">✦ ${d.id}</span>
                                    <span class="acc-stat"><b>${d.numero}</b> visits / ${d.chronos}</span>
                                </div>
                            `).join('')}
                        </div>
                    </td></tr>`;
                }
            });
            html += `</tbody></table>`;
            tableArea.innerHTML = html;
            return;
        }

        if (chartWrapper) chartWrapper.style.display = 'block';
        document.getElementById('pano-chart').style.display = 'block';
        if (terraEl) terraEl.style.display = 'none';

        const ctxEl = document.getElementById('pano-chart');
        if (!ctxEl) return;
        const ctx = ctxEl.getContext('2d');
        
        if (this.chart) this.chart.destroy();
        
        const style = getComputedStyle(document.body);
        const gridColor = style.getPropertyValue('--chart-grid-color').trim() || '#f0f0f0';
        const tickColor = style.getPropertyValue('--chart-tick-color').trim() || '#aaa';
        const labelColor = style.getPropertyValue('--chart-label-color').trim() || '#999';
        const fontFamily = style.getPropertyValue('--chart-font-family').trim() || 'monospace';
        const pointBg = style.getPropertyValue('--chart-point-bg').trim() || '#fff';

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.chart.labels,
                datasets: data.chart.datasets.map(ds => ({
                    label: ds.label,
                    data: ds.data,
                    borderColor: ds.borderColor,
                    borderWidth: ds.label === 'Anima' ? 2 : 3, 
                    borderDash: ds.borderDash || [], 
                    backgroundColor: ds.backgroundColor,
                    fill: ds.backgroundColor !== 'transparent',
                    tension: 0.3, 
                    pointRadius: ds.label === 'Anima' ? 3 : 5, 
                    pointBackgroundColor: pointBg,    
                    pointBorderColor: ds.borderColor,
                    order: ds.label === 'Anima' ? 0 : 1 
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: true, position: 'bottom' },
                    tooltip: { callbacks: { title: function(context) { return context[0].label.replace(',', ' '); } } }
                },
                scales: { 
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxRotation: Panopticon.timeUnit === 'week' ? 45 : 0,
                            minRotation: Panopticon.timeUnit === 'week' ? 45 : 0,
                            autoSkip: false, 
                            font: { family: fontFamily, size: 11 }, 
                            color: labelColor,                      
                            callback: function(value, index, ticks) {
                                if (Panopticon.subMode === 'chronos') {
                                    return index % 2 === 0 ? this.getLabelForValue(value) : '';
                                }
                                if (Panopticon.timeUnit === 'day') {
                                    const label = this.getLabelForValue(value);
                                    const isMonthChanged = Array.isArray(label);
                                    const isTargetDay = (ticks.length - 1 - index) % 2 === 0;
                                    if (isTargetDay || isMonthChanged) return label;
                                    return ''; 
                                }
                                return this.getLabelForValue(value);
                            }
                        }
                    },
                    y: { 
                        beginAtZero: true, grid: { color: gridColor }, border: { dash: [4, 4] }, ticks: { precision: 0, color: tickColor }   
                    } 
                }
            }
        });

        const tableArea = document.getElementById('data-table-area');
        if (!tableArea) return;

        if (data.chronos_mode && data.table) {
            let html = `<table class="pano-data-table"><thead><tr>
                <th style="text-align:center;">Time</th>
                <th style="text-align:right;">${data.chart.datasets[0].label}</th>
                <th style="text-align:right; color:#49dce1;">${data.chart.datasets[1].label}</th>
                <th style="text-align:right; color:#00d084;">${data.chart.datasets[2].label}</th>
            </tr></thead><tbody>`;
            data.table.forEach(row => {
                html += `<tr>
                    <td style="text-align:center; font-weight:bold; color:#555;">${row.time}</td>
                    <td style="text-align:right; color:#999;">${row.avg}</td>
                    <td style="text-align:right; color:#49dce1; font-weight:bold;">${row.prev}</td>
                    <td style="text-align:right; color:#00d084; font-weight:bold;">${row.target}</td>
                </tr>`;
            });
            tableArea.innerHTML = html + `</tbody></table>`;
        } else if (data.table && data.table.length > 0) {
            let html = `
                <table class="pano-data-table">
                    <thead>
                        <tr>
                            <th class="col-date">Date</th>
                            <th class="col-chronos">Chronos</th>
                            <th class="col-anima">Anima</th>
                            <th class="col-total">Total</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            [...data.table].reverse().forEach(row => {
                html += `
                    <tr>
                        <td class="col-date">${row.date}</td>
                        <td class="col-chronos">${row.chronos}</td>
                        <td class="col-anima">${row.anima}</td>
                        <td class="col-total">${row.total}</td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            tableArea.innerHTML = html;
        } else {
            tableArea.innerHTML = '';
        }
    },

    renderEmptyState(msg) {
        if (this.chart) this.chart.destroy();
        const tableArea = document.getElementById('data-table-area');
        if (tableArea) tableArea.innerHTML = '';
        
        const chartWrapper = document.querySelector('.chart-wrapper');
        if (chartWrapper) chartWrapper.style.display = 'block';
        
        const ctxEl = document.getElementById('pano-chart');
        if (!ctxEl) return;
        ctxEl.style.display = 'block';
        
        const ctx = ctxEl.getContext('2d');
        const style = getComputedStyle(document.body);
        const fontFamily = style.getPropertyValue('--chart-font-family').trim() || 'monospace';

        this.chart = new Chart(ctx, {
            type: 'line', data: { labels: [], datasets: [] },
            options: { plugins: { title: { display: true, text: msg, font: { family: fontFamily } } } }
        });
    },

    toggleAccordion(idx) {
        const content = document.getElementById(`acc-detail-${idx}`);
        const header = content.previousElementSibling;
        const icon = header.querySelector('.acc-icon');
        
        if (content.style.display === 'none') {
            content.style.display = 'table-row';
            icon.style.transform = 'rotate(90deg)';
        } else {
            content.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    }
};

window.Panopticon = Panopticon;
Panopticon.init();