
/* =====================================================
   BESNOS JOBS - COMPLETE SCRIPT
   Firebase v8 Compat
===================================================== */


/* =====================================================
   1. GENERAL HELPERS
===================================================== */

function getElement(id) {
    return document.getElementById(id);
}

function getValue(id) {
    const element = getElement(id);
    return element ? element.value.trim() : "";
}

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function showMessage(id, message) {
    const element = getElement(id);

    if (element) {
        element.textContent = message;
    } else {
        alert(message);
    }
}

function addText(parent, tag, value) {
    const element = document.createElement(tag);
    element.textContent =
        value === undefined || value === null || value === ""
            ? "—"
            : String(value);

    parent.appendChild(element);
    return element;
}

function addDetail(parent, label, value) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = label + ": ";
    p.appendChild(strong);

    p.appendChild(
        document.createTextNode(
            value === undefined || value === null || value === ""
                ? "—"
                : String(value)
        )
    );

    parent.appendChild(p);
}

function makeCard() {
    const card = document.createElement("div");
    card.className = "card";
    return card;
}

function makeButton(label, callback) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", callback);

    return button;
}

function databaseAvailable() {
    if (
        typeof firebase === "undefined" ||
        typeof db === "undefined" ||
        !db
    ) {
        console.error(
            "Firebase is not initialized. Check firebase.js."
        );
        return false;
    }

    return true;
}

function workerJob(worker) {
    return worker.job || worker.jobType || worker.category || "";
}

function workerLocationParts(worker) {
    return [
        worker.city,
        worker.subcity,
        worker.region,
        worker.location,
        worker.address
    ].filter(Boolean);
}


/* =====================================================
   2. WORKER REGISTRATION
===================================================== */

async function registerWorker(event) {
    if (event) event.preventDefault();

    if (!databaseAvailable()) {
        showMessage(
            "workerMessage",
            "Database connection failed. Please try again."
        );
        return;
    }

    const name = getValue("name");
    const phone = getValue("phone");
    const job = getValue("job");

    if (!name || !phone || !job) {
        showMessage(
            "workerMessage",
            "Please enter your name, phone number, and job type."
        );
        return;
    }

    const worker = {
        name: name,
        age: getValue("age"),
        gender: getValue("gender"),
        phone: phone,
        region: getValue("region"),
        city: getValue("city"),
        subcity: getValue("subcity"),
        job: job,
        experience: getValue("experience"),
        languages: getValue("languages"),
        salary: getValue("salary"),
        availability: getValue("availability"),
        status: "Pending",
        createdAt:
            firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("workers").add(worker);

        showMessage(
            "workerMessage",
            "Registration successful! Your profile is waiting for admin approval."
        );

        const form = getElement("workerForm");

        if (form) form.reset();
    } catch (error) {
        console.error("Worker registration failed:", error);

        showMessage(
            "workerMessage",
            "Registration failed. Please check your connection and try again."
        );
    }
}


/* =====================================================
   3. ADMIN LOGIN - FIREBASE AUTHENTICATION
===================================================== */

async function adminLogin(event) {
    if (event) event.preventDefault();

    const email = getValue("username");
    const password = getValue("password");
    const button = getElement("loginButton");

    if (
        typeof firebase === "undefined" ||
        typeof firebase.auth !== "function"
    ) {
        showMessage(
            "loginMessage",
            "Firebase Authentication is not loaded. Check your login page."
        );
        return;
    }

    if (!email || !password) {
        showMessage(
            "loginMessage",
            "Please enter your email and password."
        );
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Signing in...";
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(
            email,
            password
        );

        window.location.href = "admin.html";
    } catch (error) {
        console.error("Sign-in failed:", error.code);

        showMessage(
            "loginMessage",
            "Sign-in failed. Check your email and password, then try again."
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Sign In";
        }
    }
}


/* =====================================================
   4. ADMIN LOGOUT
===================================================== */

async function adminLogout() {
    if (
        typeof firebase === "undefined" ||
        typeof firebase.auth !== "function"
    ) {
        window.location.href = "admin-login.html";
        return;
    }

    try {
        await firebase.auth().signOut();
        window.location.href = "admin-login.html";
    } catch (error) {
        console.error("Logout failed:", error);
        alert("Could not sign out. Please try again.");
    }
}


/* =====================================================
   5. ADMIN - LOAD WORKER REGISTRATIONS
===================================================== */

async function loadWorkers() {
    const workerList = getElement("workerList");

    if (!workerList || !databaseAvailable()) return;

    workerList.replaceChildren();
    addText(workerList, "p", "Loading worker registrations...");

    try {
        const snapshot = await db.collection("workers").get();

        workerList.replaceChildren();

        if (snapshot.empty) {
            addText(workerList, "p", "No worker registrations yet.");
            return;
        }

        snapshot.forEach(function (doc) {
            const worker = doc.data();
            const card = makeCard();

            addText(card, "h3", worker.name || "Unnamed worker");

            addDetail(card, "Job", workerJob(worker));
            addDetail(card, "Phone", worker.phone);
            addDetail(card, "City", worker.city);
            addDetail(card, "Subcity", worker.subcity);
            addDetail(card, "Region", worker.region);
            addDetail(card, "Status", worker.status || "Pending");

            card.appendChild(
                makeButton("Approve", function () {
                    updateWorkerStatus(doc.id, "Approved");
                })
            );

            card.appendChild(
                makeButton("Reject", function () {
                    updateWorkerStatus(doc.id, "Rejected");
                })
            );

            workerList.appendChild(card);
        });
    } catch (error) {
        console.error("Loading workers failed:", error);

        workerList.replaceChildren();

        addText(
            workerList,
            "p",
            "Could not load workers. Check your Firebase permissions."
        );
    }
}

async function updateWorkerStatus(workerId, status) {
    if (!databaseAvailable()) return;

    try {
        await db.collection("workers")
            .doc(workerId)
            .update({ status: status });

        alert("Worker status updated: " + status);

        await loadWorkers();
        await loadPublicWorkers();
    } catch (error) {
        console.error("Worker update failed:", error);

        alert(
            "Could not update worker status. Check your Firebase permissions."
        );
    }
}


/* =====================================================
   6. PUBLIC APPROVED WORKERS
===================================================== */

let approvedWorkersCache = [];

async function loadPublicWorkers() {
    const container = getElement("publicWorkers");

    if (!container || !databaseAvailable()) return;

    container.replaceChildren();
    addText(container, "p", "Loading approved workers...");

    try {
        const snapshot = await db.collection("workers").get();

        approvedWorkersCache = [];

        snapshot.forEach(function (doc) {
            const worker = doc.data();

            if (normalize(worker.status) === "approved") {
                approvedWorkersCache.push({
                    ...worker,
                    id: doc.id
                });
            }
        });

        renderPublicWorkers();
    } catch (error) {
        console.error("Loading public workers failed:", error);

        container.replaceChildren();

        addText(
            container,
            "p",
            "Could not load workers. Please refresh and try again."
        );
    }
}


/* =====================================================
   7. SEARCH BY JOB TYPE AND LOCATION
===================================================== */

function renderPublicWorkers() {
    const container = getElement("publicWorkers");

    if (!container) return;

    const jobQuery = normalize(getValue("jobSearch"));
    const locationQuery = normalize(getValue("locationSearch"));

    const allJobs = [
        "",
        "all",
        "all jobs",
        "any",
        "any job"
    ].includes(jobQuery);

    const results = approvedWorkersCache.filter(function (worker) {
        const job = normalize(workerJob(worker));

        const locations = workerLocationParts(worker)
            .map(normalize)
            .filter(Boolean);

        const matchesJob =
            allJobs ||
            job.includes(jobQuery) ||
            jobQuery.includes(job);

        const matchesLocation =
            !locationQuery ||
            locations.some(function (part) {
                return part.includes(locationQuery);
            });

        return matchesJob && matchesLocation;
    });

    container.replaceChildren();

    if (approvedWorkersCache.length === 0) {
        addText(
            container,
            "p",
            "No approved workers are available yet."
        );
        return;
    }

    if (results.length === 0) {
        addText(
            container,
            "p",
            "No matching workers found. Try a different job type or location."
        );
        return;
    }

    addText(
        container,
        "p",
        results.length + " worker(s) found."
    );

    results.forEach(function (worker) {
        const card = makeCard();

        card.classList.add("worker-card");

        addText(card, "h3", worker.name || "Worker");
        addDetail(card, "Job", workerJob(worker));

        addDetail(
            card,
            "Location",
            workerLocationParts(worker).join(", ")
        );

        addDetail(card, "Experience", worker.experience);
        addDetail(card, "Languages", worker.languages);
        addDetail(card, "Availability", worker.availability);

        addText(card, "p", "Approved Worker");

        card.appendChild(
            makeButton("Request Contact", function () {
                requestContact(worker.id, worker.name || "Worker");
            })
        );

        container.appendChild(card);
    });
}

function searchWorkers(event) {
    if (event) event.preventDefault();
    renderPublicWorkers();
}


/* =====================================================
   8. EMPLOYER - OPEN CONTACT REQUEST FORM
===================================================== */

function requestContact(workerId, workerName) {
    const url = new URL(
        "request-contact.html",
        window.location.href
    );

    url.searchParams.set("workerId", workerId);
    url.searchParams.set("workerName", workerName);

    window.location.href = url.href;
}


/* =====================================================
   9. EMPLOYER - SUBMIT CONTACT REQUEST
===================================================== */

async function submitContactRequest(event) {
    if (event) event.preventDefault();

    if (!databaseAvailable()) {
        showMessage(
            "requestStatusMessage",
            "Database connection failed. Please try again."
        );
        return;
    }

    const employerName =
        getValue("requestName") ||
        getValue("employerName") ||
        getValue("yourName");

    const employerPhone =
        getValue("requestPhone") ||
        getValue("employerPhone") ||
        getValue("yourPhone");

    const workerId = getValue("workerId");

    const workerName =
        getValue("workerName") ||
        getValue("selectedWorkerName");

    const message = getValue("message");

    if (!employerName || !employerPhone || !workerName) {
        showMessage(
            "requestStatusMessage",
            "Please enter your name, phone number, and selected worker."
        );
        return;
    }

    try {
        await db.collection("contactRequests").add({
            employerName: employerName,
            employerPhone: employerPhone,
            workerId: workerId,
            workerName: workerName,
            message: message,
            status: "Pending",
            createdAt:
                firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(
            "requestStatusMessage",
            "Your request was submitted. Please wait for admin approval."
        );

        const form = getElement("requestContactForm");

        if (form) form.reset();
    } catch (error) {
        console.error("Contact request failed:", error);

        showMessage(
            "requestStatusMessage",
            "Could not submit your request. Please try again."
        );
    }
}


/* =====================================================
   10. ADMIN - LOAD CONTACT REQUESTS
===================================================== */

async function loadContactRequests() {
    const container = getElement("requestList");

    if (!container || !databaseAvailable()) return;

    container.replaceChildren();
    addText(container, "p", "Loading contact requests...");

    try {
        const snapshot = await db.collection("contactRequests").get();

        container.replaceChildren();

        if (snapshot.empty) {
            addText(container, "p", "No contact requests yet.");
            return;
        }

        snapshot.forEach(function (doc) {
            const request = doc.data();
            const card = makeCard();

            addText(card, "h3", "Contact Request");

            addDetail(card, "Employer", request.employerName);
            addDetail(card, "Employer Phone", request.employerPhone);
            addDetail(card, "Worker", request.workerName);
            addDetail(card, "Message", request.message);
            addDetail(card, "Status", request.status || "Pending");

            card.appendChild(
                makeButton("Approve Request", function () {
                    updateContactRequestStatus(doc.id, "Approved");
                })
            );

            card.appendChild(
                makeButton("Reject Request", function () {
                    updateContactRequestStatus(doc.id, "Rejected");
                })
            );

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Loading requests failed:", error);

        container.replaceChildren();

        addText(
            container,
            "p",
            "Could not load requests. Check Firebase permissions."
        );
    }
}

async function updateContactRequestStatus(requestId, status) {
    if (!databaseAvailable()) return;

    try {
        await db.collection("contactRequests")
            .doc(requestId)
            .update({ status: status });

        alert("Request status updated: " + status);

        await loadContactRequests();
    } catch (error) {
        console.error("Updating request failed:", error);

        alert(
            "Could not update the request. Check Firebase permissions."
        );
    }
}


/* =====================================================
   11. EMPLOYER - CHECK REQUEST STATUS
===================================================== */

async function checkStatus(event) {
    if (event) event.preventDefault();

    if (!databaseAvailable()) {
        showMessage(
            "statusResults",
            "Database connection failed. Please try again."
        );
        return;
    }

    const phone =
        getValue("statusPhoneSearch") ||
        getValue("statusPhone") ||
        getValue("phoneSearch");

    const container = getElement("statusResults");

    if (!phone) {
        showMessage(
            "statusResults",
            "Enter the phone number used for your request."
        );
        return;
    }

    if (container) {
        container.replaceChildren();
        addText(container, "p", "Checking requests...");
    }

    try {
        const snapshot = await db.collection("contactRequests").get();
        const matches = [];

        snapshot.forEach(function (doc) {
            const request = doc.data();

            if (
                normalize(request.employerPhone) === normalize(phone)
            ) {
                matches.push({
                    ...request,
                    id: doc.id
                });
            }
        });

        if (container) container.replaceChildren();

        if (matches.length === 0) {
            showMessage(
                "statusResults",
                "No requests found for this phone number."
            );
            return;
        }

        for (const request of matches) {
            const card = makeCard();

            addDetail(card, "Worker", request.workerName);
            addDetail(
                card,
                "Status",
                request.status || "Pending"
            );

            if (normalize(request.status) === "pending") {
                addText(
                    card,
                    "p",
                    "Your request is waiting for admin approval."
                );
            } else if (normalize(request.status) === "rejected") {
                addText(
                    card,
                    "p",
                    "Your request was not approved."
                );
            } else if (normalize(request.status) === "approved") {
                /*
                 * Display the phone only after approval.
                 * Firestore rules must also enforce this
                 * restriction on the database.
                 */
                try {
                    let worker = null;

                    if (request.workerId) {
                        const workerDoc = await db
                            .collection("workers")
                            .doc(request.workerId)
                            .get();

                        if (workerDoc.exists) {
                            worker = workerDoc.data();
                        }
                    }

                    if (worker && worker.phone) {
                        addDetail(
                            card,
                            "Worker Phone",
                            worker.phone
                        );
                    } else {
                        addText(
                            card,
                            "p",
                            "The request is approved, but contact details are unavailable."
                        );
                    }
                } catch (error) {
                    console.error("Loading contact details failed:", error);

                    addText(
                        card,
                        "p",
                        "The request is approved, but contact details could not be loaded."
                    );
                }
            }

            if (container) container.appendChild(card);
        }
    } catch (error) {
        console.error("Checking status failed:", error);

        showMessage(
            "statusResults",
            "Could not check your requests. Please try again."
        );
    }
}


/* =====================================================
   12. INITIALIZE THE WEBSITE
===================================================== */

function initializeBesnosJobs() {
    /*
     * Connect forms.
     */
    const workerForm = getElement("workerForm");

    if (workerForm) {
        workerForm.addEventListener("submit", registerWorker);
    }

    const searchForm = getElement("workerSearchForm");

    if (searchForm) {
        searchForm.addEventListener("submit", searchWorkers);
    }

    const searchButton = getElement("searchWorkersButton");

    if (searchButton) {
        searchButton.addEventListener("click", searchWorkers);
    }

    const jobSearch = getElement("jobSearch");
    const locationSearch = getElement("locationSearch");

    if (jobSearch) {
        jobSearch.addEventListener("input", renderPublicWorkers);
    }

    if (locationSearch) {
        locationSearch.addEventListener("input", renderPublicWorkers);
    }

    const contactForm = getElement("requestContactForm");

    if (contactForm) {
        contactForm.addEventListener(
            "submit",
            submitContactRequest
        );

        const params = new URLSearchParams(window.location.search);

        if (getElement("workerId") && params.has("workerId")) {
            getElement("workerId").value = params.get("workerId");
        }

        if (getElement("workerName") && params.has("workerName")) {
            getElement("workerName").value = params.get("workerName");
        }
    }

    const statusForm = getElement("statusForm");

    if (statusForm) {
        statusForm.addEventListener("submit", checkStatus);
    }

    /*
     * Public worker listings do not require admin sign-in.
     */
    if (getElement("publicWorkers")) {
        loadPublicWorkers();
    }

    /*
     * Protect the dashboard from displaying data to
     * visitors who are not signed in.
     */
    const isAdminPage =
        getElement("workerList") ||
        getElement("requestList");

    if (isAdminPage) {
        if (
            typeof firebase === "undefined" ||
            typeof firebase.auth !== "function"
        ) {
            alert("Firebase Authentication is unavailable.");
            window.location.href = "admin-login.html";
            return;
        }

        firebase.auth().onAuthStateChanged(function (user) {
            if (!user) {
                window.location.replace("admin-login.html");
                return;
            }

            if (getElement("workerList")) {
                loadWorkers();
            }

            if (getElement("requestList")) {
                loadContactRequests();
            }
        });
    }
}


/* =====================================================
   13. START
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeBesnosJobs
    );
} else {
    initializeBesnosJobs();
}
