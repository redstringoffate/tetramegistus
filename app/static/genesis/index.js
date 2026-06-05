// static/genesis/index.js


/* ─────────────────────────────
   Form New Vessel button
───────────────────────────── */

const formBtn = document.getElementById("form-me")

if (formBtn) {
	formBtn.addEventListener("click", function () {
		window.location.href = "/form/me"
	})
}
