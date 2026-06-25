// static/genesis/form_me.js

document.addEventListener("DOMContentLoaded", () => {

	/* ─────────────────────────
	   Utils
	───────────────────────── */

	function uuid() {
		return crypto.randomUUID()
	}

	// 🔑 쿠키 굽기 함수 (인코딩 안정성 확보)
	function setCookie(name, value, days = 7) {
		const expires = new Date(Date.now() + days * 864e5).toUTCString();
		// SameSite=Lax 설정을 통해 브라우저 보안 정책 준수
		document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
	}

	/* ─────────────────────────
	   Elements
	───────────────────────── */

	const yearSel   = document.getElementById("year")
	const monthSel  = document.getElementById("month")
	const daySel    = document.getElementById("day")

	const hourSel   = document.getElementById("hour")
	const minuteSel = document.getElementById("minute")
	const secondSel = document.getElementById("second")

	const cityInput   = document.getElementById("city-search")
	const cityResults = document.getElementById("city-results")

	const manualToggle = document.getElementById("manual-toggle")
	const manualPanel  = document.getElementById("manual-panel")

	const latInt = document.getElementById("lat-int")
	const latDec = document.getElementById("lat-dec")
	const lonInt = document.getElementById("lon-int")
	const lonDec = document.getElementById("lon-dec")
	const tzSelect = document.getElementById("tz-select")

	const signBtns = document.querySelectorAll(".sign-btn")
	const tooltip  = document.getElementById("sign-tooltip")

	const incarnateBtn = document.getElementById("incarnate")

	/* ─────────────────────────
	   State
	───────────────────────── */

	let cities = {}
	let pendingLocation = null
	let manualOpen = false

	let latSign = "+"
	let lonSign = "+"

	let activeIndex = -1
	let currentResults = []

	/* ─────────────────────────
	   Select helpers
	───────────────────────── */

	function fillSelect(select, from, to) {
		select.innerHTML = ""
		for (let i = from; i <= to; i++) {
			const opt = document.createElement("option")
			opt.value = i
			opt.textContent = String(i).padStart(2, "0")
			select.appendChild(opt)
		}
	}

	function daysInMonth(year, month) {
		if (month === 2) {
			return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
				? 29 : 28
		}
		return [4, 6, 9, 11].includes(month) ? 30 : 31
	}

	function monthToNumber(month) {
		return parseInt(month, 10);
	}

	function clampDay() {
		const max = daysInMonth(+yearSel.value, +monthSel.value)
		const cur = Math.min(+daySel.value || 1, max)
		fillSelect(daySel, 1, max)
		daySel.value = cur
	}

/* ─────────────────────────
	   Initial populate
	───────────────────────── */

	const nowYear = new Date().getFullYear()
	fillSelect(yearSel, 1900, nowYear + 1)
	fillSelect(monthSel, 1, 12)
	fillSelect(hourSel, 0, 23)
	fillSelect(minuteSel, 0, 59)
	fillSelect(secondSel, 0, 59)

	yearSel.value = 1992
	monthSel.value = 6
	clampDay()
	daySel.value = 1

	// 🔑 주요 시간대 약어 매핑 (친화적 표기용)
	const tzNames = {
		"-10": "HST", "-8": "PST", "-7": "MST", "-6": "CST", "-5": "EST",
		"0": "UTC/GMT", "+1": "CET", "+2": "EET", "+3": "MSK", "+5.5": "IST",
		"+7": "WIB", "+8": "CST/SGT", "+9": "KST/JST", "+10": "AEST", "+12": "NZST"
	};

	tzSelect.innerHTML = ""
	for (let i = -12; i <= 14; i++) {
		const opt = document.createElement("option")
		opt.value = i
		const offsetStr = (i >= 0 ? "+" : "") + i;
		const friendly = tzNames[offsetStr] || "";
		// 🔑 표기만 친화적으로 변경: UTC+9 (KST/JST)
		opt.textContent = `UTC${offsetStr}${friendly ? ` (${friendly})` : ""}`;
		if (i === 9) opt.selected = true
		tzSelect.appendChild(opt)
	}

	/* ─────────────────────────
	   Coordinate limits
	───────────────────────── */

	function clampIntInput(input, min, max) {
		input.addEventListener("input", () => {
			let v = parseInt(input.value || "0", 10)
			if (isNaN(v)) v = min
			v = Math.max(min, Math.min(max, v))
			input.value = v
		})
	}

	function clampDecInput(input, digits) {
		input.addEventListener("input", () => {
			input.value = input.value.replace(/\D/g, "").slice(0, digits)
		})
	}

	clampIntInput(latInt, 0, 90)
	clampDecInput(latDec, 4)

	clampIntInput(lonInt, 0, 180)
	clampDecInput(lonDec, 4)

	/* ─────────────────────────
	   Events
	───────────────────────── */

	yearSel.onchange = clampDay
	monthSel.onchange = clampDay

	manualToggle.onclick = () => {
		manualOpen = !manualOpen
		manualPanel.style.display = manualOpen ? "block" : "none"

		if (manualOpen) {
			pendingLocation = null
			cityInput.value = ""
			cityResults.innerHTML = ""
			activeIndex = -1
			currentResults = []
		}
	}

	signBtns.forEach(btn => {
		btn.onclick = () => {
			const target = btn.dataset.target
			const sign = btn.dataset.sign

			signBtns.forEach(b => {
				if (b.dataset.target === target) {
					b.classList.remove("active")
				}
			})

			btn.classList.add("active")
			if (target === "lat") latSign = sign
			if (target === "lon") lonSign = sign
		}

		btn.addEventListener("mouseenter", e => {
			const sign = btn.dataset.sign
			const target = btn.dataset.target

			let label = ""
			if (target === "lat") label = sign === "+" ? "North" : "South"
			if (target === "lon") label = sign === "+" ? "East"  : "West"

			tooltip.textContent = label
			tooltip.style.left = e.clientX + 12 + "px"
			tooltip.style.top  = e.clientY + 12 + "px"
			tooltip.style.opacity = 1
		})

		btn.addEventListener("mouseleave", () => {
			tooltip.style.opacity = 0
		})
	})

	/* ─────────────────────────
	   City search
	───────────────────────── */

	let citySearchTimeout = null;

	function renderResults(list) {
		cityResults.innerHTML = ""
		list.forEach((d, i) => {
			const div = document.createElement("div")
			div.className = "city-item"
			div.textContent = d.label
			if (i === activeIndex) div.classList.add("active")
			div.onclick = () => selectCity(i)
			cityResults.appendChild(div)
		})
	}

	function selectCity(index) {
		const d = currentResults[index]
		if (!d) return

		manualOpen = false
		manualPanel.style.display = "none"

		latInt.value = ""
		latDec.value = ""
		lonInt.value = ""
		lonDec.value = ""

		// 🔑 [DB 규격 동기화]: d.lon 대신 시스템 표준인 d.lng를 수신합니다.
		pendingLocation = {
			type: "city",
			lat: d.lat,
			lon: d.lng || d.lon, // 안정성을 위한 이중 캐칭
			tz: d.tz,
			label: d.label,
		}

		cityInput.value = d.label
		cityResults.innerHTML = ""
		activeIndex = -1
		currentResults = []
	}

	cityInput.addEventListener("input", () => {
		const q = cityInput.value.trim();
        
		if (!q || q.length < 2) {
			cityResults.innerHTML = ""
			currentResults = []
			activeIndex = -1
			return
		}

		manualOpen = false
		manualPanel.style.display = "none"

		clearTimeout(citySearchTimeout);
		citySearchTimeout = setTimeout(async () => {
			try {
				const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
				if (res.ok) {
					currentResults = await res.json();
					activeIndex = -1;
					renderCityResults(currentResults);
				}
			} catch (err) {
				console.error("💀 [API ERROR]: City lookup failed.", err);
			}
		}, 300);
	})

	/* ─────────────────────────
	   Arrow key handling
	───────────────────────── */

	document.addEventListener("keydown", e => {

		if (document.activeElement !== cityInput) return
		if (!currentResults.length) return

		if (e.key === "ArrowDown") {
			e.preventDefault()
			activeIndex = (activeIndex + 1) % currentResults.length
			renderResults(currentResults)
		}

		else if (e.key === "ArrowUp") {
			e.preventDefault()
			activeIndex =
				(activeIndex - 1 + currentResults.length) %
				currentResults.length
			renderResults(currentResults)
		}

		else if (e.key === "Enter") {
			e.preventDefault()
			if (activeIndex >= 0) selectCity(activeIndex)
		}

		else if (e.key === "Escape") {
			cityResults.innerHTML = ""
			activeIndex = -1
		}
	})

/* ─────────────────────────
	   Incarnate (v13 Absolute Structure & Active Memory 수복)
	───────────────────────── */

	incarnateBtn.onclick = (e) => {
		// 🛡️ [Airtight Guard 0]: 모든 기본 동작 차단
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		let finalLocation = null;
		let timezoneValue = tzSelect.value;

		if (manualOpen) {
			const latV = parseInt(latInt.value || 0, 10) + parseFloat("0." + (latDec.value || "0"));
			const lonV = parseInt(lonInt.value || 0, 10) + parseFloat("0." + (lonDec.value || "0"));
			const lat = (latSign === "-" ? -1 : 1) * latV;
			const lon = (lonSign === "-" ? -1 : 1) * lonV;

			if (lat === 0 && lon === 0) {
				alert("Location Omitted: Precise coordinates required.");
				return false;
			}
			
			const latS = lat >= 0 ? "N" : "S";
			const lonS = lon >= 0 ? "E" : "W";
			const displayLabel = `${Math.abs(lat).toFixed(2)}° ${latS}, ${Math.abs(lon).toFixed(2)}° ${lonS} (UTC${timezoneValue >= 0 ? "+" : ""}${timezoneValue})`;
			
			finalLocation = { type: "manual", lat, lon, label: displayLabel, tz: timezoneValue };
		} else {
			const currentText = cityInput.value.trim();
			// 🛡️ [Airtight Guard 1]: 검색창 텍스트 존재 여부를 물리적으로 우선 확인
			if (!currentText) {
				alert("Location Omitted: Point of Emergence required.");
				cityInput.focus();
				return false;
			}
			// 🛡️ [Airtight Guard 2]: 선택된 데이터와 텍스트 일치 여부 대조
			if (pendingLocation && currentText === pendingLocation.label) {
				finalLocation = pendingLocation;
				timezoneValue = pendingLocation.tz;
			}
		}

		// 🛡️ [Airtight Guard 3]: 최종 위치 객체 부재 시 저장 로직 진입 원천 차단
		if (!finalLocation) {
			alert("Location Omitted: Point of Emergence required.");
			cityInput.focus();
			return false;
		}

		// 🔑 [v13 수복]: 데이터 작성이 시작됩니다.
		const finalDate = `${yearSel.value}-${String(monthSel.value).padStart(2, '0')}-${String(daySel.value).padStart(2, '0')}`;
		const finalTime = `${String(hourSel.value).padStart(2, '0')}:${String(minuteSel.value).padStart(2, '0')}:${String(secondSel.value).padStart(2, '0')}`;
		const locStr = finalLocation.label;

		// 🏛️ [v13 Absolute Structure]: 물리적 실체(has_body=1)와 타임존 인프라 안착
		const me = {
			id: uuid(),
			idx: 0, 
			name: "[me]", // 🔑 명칭 규격화
			has_body: 1,  // 🔑 v13 강령: 물리적 실체임을 명시
			created_at: new Date().toISOString(),
			birth_date: finalDate,
			birth_time: finalTime,
			birth: `${finalDate} ${finalTime}`,
			location: locStr,
			lat: finalLocation.lat,
			lng: finalLocation.lon || finalLocation.lng,
			timezone: timezoneValue, // 🔑 타임존 오프셋 각인
			timestamp: Date.now()
		};

		// ⚡ [v13 Active Circuit]: 활성 데이터베이스 회로 가동
		// 'tetramegistus.me'는 영구 보존용이며, 'active_seed'는 n2/a2 연산 엔진이 즉시 참조할 캐시입니다.
		localStorage.setItem("tetramegistus.me", JSON.stringify(me));
		localStorage.setItem("active_seed", JSON.stringify(me)); 

		// 🚀 [추가]: [me] 시드 굽기(육신 현현) 성공 시 발송
		fetch('/api/godmode/pulse', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({ module: 'RITUAL_ME_SEED', duration: 0 })
		}).catch(e => console.log('Pulse error', e));

		// 기존 쿠키 브릿지 유지 (회원가입 시 Anamnesis 이관용)
		setCookie("temp_birth_date", finalDate);
		setCookie("temp_birth_time", finalTime);
		setCookie("temp_location", locStr);
		setCookie("temp_birth", `${finalDate} ${finalTime}`);
		setCookie("temp_lat", finalLocation.lat);
		setCookie("temp_lng", finalLocation.lon || finalLocation.lng);
		setCookie("temp_tz", timezoneValue);

		/* ① 2초 정적 연출 시작 */
		setTimeout(() => {
			const overlay = document.createElement("div")
			overlay.style.position = "fixed"
			overlay.style.inset = "0"
			overlay.style.pointerEvents = "none"
			overlay.style.zIndex = "9999"

			const veil = document.createElement("div")
			veil.style.position = "absolute"
			veil.style.inset = "0"
			veil.style.background = "rgba(0,0,0,0.78)"

			const text = document.createElement("div")
			text.textContent = "the body has manifested"
			text.style.position = "absolute"
			text.style.top = "50%"
			text.style.left = "50%"
			text.style.transform = "translate(-50%,-50%)"
			text.style.color = "rgb(3,234,252)"
			text.style.fontFamily = "Consolas,'Cascadia Code','JetBrains Mono','Fira Code',Menlo,Monaco,'Courier New',monospace"
			text.style.fontSize = "0.84rem"
			text.style.letterSpacing = "0.18em"
			text.style.opacity = "0.85"

			overlay.appendChild(veil)
			overlay.appendChild(text)
			document.body.appendChild(overlay)

			/* ② 5초 현현 후 이동 */
			setTimeout(() => {
				window.location.replace("/world")
			}, 5000)
		}, 2000)
	}

})