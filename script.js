
// ==========================================
// BESNOS JOBS - SCRIPT.JS
// Worker registration, worker search, admin
// dashboard, contact requests, and status checks.
// Firebase v8 / compat version
// ==========================================

"use strict";

// ==========================================
// SHARED HELPERS
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}

function showMessage(container, message, heading = "p") {
    if (!container) return;

    container.replaceChildren();

    const element = document.createElement(heading);
    element.textContent = message;
    container.appendChild(element);
}

function addText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text == null ? "" : String(text);
    parent.appendChild(element);
    return element;
}

function addField(card, label, value) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = label + ": ";
    p.appendChild(strong);

    p.appendChild(
        document.createTextNode(
            value == null || value === "" ? "—" : String(value)
        )
    );

    card.appendChild(p);
}

function makeButton(label, onClick) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);

    return button;
}

function makeCard(title) {
    const card = document.createElement("div");
    card.className = "card";

    addText(card, "h3", title || "Unnamed");

    return card;
}

function databaseAvailable() {
    if (typeof db === "undefined" || !db) {
        console.error(
            "Firebase database is unavailable. Check firebase.js."
        );

        return false;
    }

    return true;
}

// ==========================================
// WORKER REGISTRATION
// ==========================================

const workerForm = getElement("workerForm");

if (workerForm) {
    workerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!databaseAvailable()) {
            alert("The service is unavailable. Please try again later.");
            return;
        }

        function value(id) {
            const element = getElement(id);
            return element ? element.value.trim() : "";
        }

        const worker = {
            name: value("name"),
            age: Number(value("age")) || 0,
            gender: value("gender"),
            phone: value("phone"),
            region: value("region"),
            city: value("city"),
            subcity: value("subcity"),
            job: value("job"),
            experience: Number(value("experience")) || 0,
            languages: value("languages"),
            salary: Number(value("salary")) || 0,
            availability: value("availability"),
            status: "Pending",
            createdAt: new Date()
        };

        if (!worker.name || !worker.phone || !worker.job) {
            alert("Please enter your name, phone number, and job type.");
            return;
        }

        const submitButton =
            workerForm.querySelector('[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            await db.collection("workers").add(worker);

            alert(
                "Worker registration submitted! It will be reviewed before appearing publicly."
            );

            workerForm.reset();

        } catch (error) {
            console.error("Worker registration error:", error);

            alert(
                "Registration failed. Please check your connection and try again."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

// ==========================================
// ADMIN LOGIN
// IMPORTANT: This is the existing basic login.
// It is NOT secure for a public website.
// ==========================================

function adminLogin() {
    const usernameElement = getElement("username");
    const passwordElement = getElement("password");

    if (!usernameElement || !passwordElement) {
        alert("Login form could not be found.");
        return;
    }

    const username = usernameElement.value.trim();
    const password = passwordElement.value;

    // Preserved for compatibility with your current website.
    if (username === "admin" && password === "12345") {
        window.location.href = "admin.html";
    } else {
        alert("Wrong username or password.");
    }
}

// ==========================================
// LOAD WORKERS FOR ADMIN
// ==========================================

async function loadWorkers() {
    const workerList = getElement("workerList");

    if (!workerList) return;

    if (!databaseAvailable()) {
        showMessage(workerList, "Unable to connect to the database.");
        return;
    }

    showMessage(workerList, "Loading worker registrations...");

    try {
        const snapshot = await db.collection("workers").get();

        workerList.replaceChildren();

        if (snapshot.empty) {
            showMessage(
                workerList,
                "No worker registrations yet.",
                "h3"
            );

            return;
        }

        snapshot.forEach(function (doc) {
            const worker = doc.data() || {};

            const card = makeCard(
                worker.name || "Unnamed worker"
            );

            addField(card, "Age", worker.age);
            addField(card, "Gender", worker.gender);
            addField(card, "Phone", worker.phone);
            addField(card, "Region", worker.region);
            addField(card, "City", worker.city);
            addField(card, "Sub-city", worker.subcity);
            addField(card, "Job", worker.job);

            addField(
                card,
                "Experience",
                (worker.experience || 0) + " years"
            );

            addField(card, "Languages", worker.languages);

            addField(
                card,
                "Expected Salary",
                (worker.salary || 0) + " ETB"
            );

            addField(card, "Availability", worker.availability);

            addField(
                card,
                "Status",
                worker.status || "Pending"
            );

            card.appendChild(
                makeButton("Approve", function () {
                    approveWorker(
                        doc.id,
                        worker.name || "Worker"
                    );
                })
            );

            card.appendChild(
                document.createTextNode(" ")
            );

            card.appendChild(
                makeButton("Reject", function () {
                    rejectWorker(
                        doc.id,
                        worker.name || "Worker"
                    );
                })
            );

            workerList.appendChild(card);
        });

    } catch (error) {
        console.error("Loading workers failed:", error);

        showMessage(
            workerList,
            "Unable to load workers. Please try again.",
            "h3"
        );
    }
}

// ==========================================
// APPROVE OR REJECT WORKERS
// ==========================================

async function updateWorkerStatus(id, name, status) {
    if (!databaseAvailable()) {
        alert("The service is temporarily unavailable.");
        return;
    }

    try {
        await db.collection("workers")
            .doc(id)
            .update({ status: status });

        alert(
            name + " has been " + status.toLowerCase() + "."
        );

        await loadWorkers();
        await loadPublicWorkers();

    } catch (error) {
        console.error("Worker status update failed:", error);

        alert(
            "Could not update this worker. Please try again."
        );
    }
}

function approveWorker(id, name) {
    return updateWorkerStatus(id, name, "Approved");
}

function rejectWorker(id, name) {
    return updateWorkerStatus(id, name, "Rejected");
}

// ==========================================
// LOAD APPROVED WORKERS
// ==========================================

let approvedWorkersCache = [];

async function loadPublicWorkers() {
    const publicWorkers = getElement("publicWorkers");

    if (!publicWorkers) return;

    if (!databaseAvailable()) {
        showMessage(
            publicWorkers,
            "Unable to connect to the database."
        );

        return;
    }

    showMessage(publicWorkers, "Loading available workers...");

    try {
        const snapshot = await db.collection("workers")
            .where("status", "==", "Approved")
            .get();

        approvedWorkersCache = snapshot.docs.map(function (doc) {
            return {
                id: doc.id,
                ...doc.data()
            };
        });

        renderPublicWorkers();

    } catch (error) {
        console.error("Loading public workers failed:", error);

        showMessage(
            publicWorkers,
            "Unable to load workers. Please try again.",
            "h3"
        );
    }
}

// ==========================================
// DISPLAY AND FILTER PUBLIC WORKERS
// ==========================================

function renderPublicWorkers() {
    const publicWorkers = getElement("publicWorkers");

    if (!publicWorkers) return;

    const locationInput = getElement("locationSearch");
    const jobInput = getElement("jobSearch");

    const locationQuery = locationInput
        ? locationInput.value.trim().toLowerCase()
        : "";

    const selectedJob = jobInput
        ? jobInput.value.trim().toLowerCase()
        : "";

    const filteredWorkers = approvedWorkersCache.filter(
        function (worker) {
            const workerJob = String(
                worker.job || ""
            ).trim().toLowerCase();

            const workerLocation = [
                worker.city,
                worker.region,
                worker.subcity
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesJob =
                !selectedJob ||
                selectedJob === "all jobs" ||
                selectedJob === "all" ||
                workerJob === selectedJob;

            const matchesLocation =
                !locationQuery ||
                workerLocation.includes(locationQuery);

            return matchesJob && matchesLocation;
        }
    );

    publicWorkers.replaceChildren();

    if (approvedWorkersCache.length === 0) {
        showMessage(
            publicWorkers,
            "No approved workers available yet.",
            "h3"
        );

        return;
    }

    if (filteredWorkers.length === 0) {
        const language =
            localStorage.getItem("besnosLanguage") || "en";

        showMessage(
            publicWorkers,
            language === "am"
                ? "የፍለጋዎን መስፈርት የሚያሟሉ ሰራተኞች አልተገኙም።"
                : "No workers match your search.",
            "h3"
        );

        return;
    }

    filteredWorkers.forEach(function (worker) {
        const card = makeCard(worker.name || "Worker");

        addField(card, "Job", worker.job);

        addField(
            card,
            "Location",
            [worker.city, worker.region]
                .filter(Boolean)
                .join(", ")
        );

        addField(
            card,
            "Experience",
            (worker.experience || 0) + " years"
        );

        addField(card, "Languages", worker.languages);
        addField(card, "Availability", worker.availability);

        addText(card, "p", "✓ Verified Worker");

        card.appendChild(
            makeButton("Request Contact", function () {
                requestContact(
                    worker.id,
                    worker.name || "Worker"
                );
            })
        );

        publicWorkers.appendChild(card);
    });
}

// Search function used by the search form/button.
function searchWorkers() {
    renderPublicWorkers();
}

// Connect the search form if it exists.
const workerSearchForm = getElement("workerSearchForm");

if (workerSearchForm) {
    workerSearchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        searchWorkers();
    });
}

// Support an optional button with this ID.
const searchButton = getElement("searchWorkersButton");

if (searchButton && !workerSearchForm) {
    searchButton.addEventListener("click", searchWorkers);
}

// ==========================================
// EMPLOYER: REQUEST WORKER CONTACT
// ==========================================

async function requestContact(workerId, workerName) {
    if (!databaseAvailable()) {
        alert("The service is temporarily unavailable.");
        return;
    }

    const employerName = prompt("Enter your full name:");

    if (
        employerName === null ||
        !employerName.trim()
    ) {
        return;
    }

    const employerPhone = prompt("Enter your phone number:");

    if (
        employerPhone === null ||
        !employerPhone.trim()
    ) {
        return;
    }

    try {
        await db.collection("contactRequests").add({
            employerName: employerName.trim(),
            employerPhone: employerPhone.trim(),
            workerId: workerId,
            workerName: workerName,
            status: "Pending",
            createdAt: new Date()
        });

        alert(
            "Your request to contact " +
            workerName +
            " has been submitted. You can check its status later."
        );

    } catch (error) {
        console.error("Contact request error:", error);

        alert(
            "Your request could not be saved. Please try again."
        );
    }
}

// ==========================================
// ADMIN: LOAD CONTACT REQUESTS
// ==========================================

async function loadContactRequests() {
    const requestList = getElement("requestList");

    if (!requestList) return;

    if (!databaseAvailable()) {
        showMessage(
            requestList,
            "Unable to connect to the database."
        );

        return;
    }

    showMessage(requestList, "Loading contact requests...");

    try {
        const snapshot =
            await db.collection("contactRequests").get();

        requestList.replaceChildren();

        if (snapshot.empty) {
            showMessage(
                requestList,
                "No contact requests yet.",
                "h3"
            );

            return;
        }

        snapshot.forEach(function (doc) {
            const request = doc.data() || {};

            const card = makeCard("Contact Request");

            addField(card, "Employer", request.employerName);
            addField(card, "Employer Phone", request.employerPhone);
            addField(card, "Worker", request.workerName);

            addField(
                card,
                "Status",
                request.status || "Pending"
            );

            card.appendChild(
                makeButton("Approve Request", function () {
                    approveRequest(doc.id);
                })
            );

            card.appendChild(
                document.createTextNode(" ")
            );

            card.appendChild(
                makeButton("Reject Request", function () {
                    rejectRequest(doc.id);
                })
            );

            requestList.appendChild(card);
        });

    } catch (error) {
        console.error("Loading contact requests failed:", error);

        showMessage(
            requestList,
            "Unable to load contact requests. Please try again.",
            "h3"
        );
    }
}

// ==========================================
// APPROVE OR REJECT CONTACT REQUESTS
// ==========================================

async function updateRequestStatus(id, status) {
    if (!databaseAvailable()) {
        alert("The service is temporarily unavailable.");
        return;
    }

    try {
        await db.collection("contactRequests")
            .doc(id)
            .update({ status: status });

        alert(
            "Contact request " + status.toLowerCase() + "."
        );

        await loadContactRequests();

    } catch (error) {
        console.error("Contact request update failed:", error);

        alert(
            "Could not update this contact request. Please try again."
        );
    }
}

function approveRequest(id) {
    return updateRequestStatus(id, "Approved");
}

function rejectRequest(id) {
    return updateRequestStatus(id, "Rejected");
}

// ==========================================
// EMPLOYER: CHECK REQUEST STATUS
// ==========================================

async function checkStatus() {
    const phoneInput = getElement("statusPhoneSearch");
    const results = getElement("statusResults");

    if (!phoneInput || !results) return;

    const phone = phoneInput.value.trim();

    if (!phone) {
        showMessage(
            results,
            "Please enter your phone number.",
            "h3"
        );

        return;
    }

    if (!databaseAvailable()) {
        showMessage(
            results,
            "The service is temporarily unavailable.",
            "h3"
        );

        return;
    }

    showMessage(results, "Checking request status...", "h3");

    try {
        const snapshot = await db.collection("contactRequests")
            .where("employerPhone", "==", phone)
            .get();

        results.replaceChildren();

        if (snapshot.empty) {
            showMessage(
                results,
                "No request found. Please check the phone number and try again.",
                "h3"
            );

            return;
        }

        for (const doc of snapshot.docs) {
            const request = doc.data() || {};

            const card = makeCard("Contact Request");

            addField(card, "Worker", request.workerName);

            addField(
                card,
                "Status",
                request.status || "Pending"
            );

            if (request.status === "Approved") {
                try {
                    const workerDoc = await db
                        .collection("workers")
                        .doc(request.workerId)
                        .get();

                    if (workerDoc.exists) {
                        const worker = workerDoc.data() || {};

                        addField(
                            card,
                            "Worker Phone",
                            worker.phone || ""
                        );

                        addText(
                            card,
                            "p",
                            "Your request was approved. You can now contact the worker."
                        );

                    } else {
                        addText(
                            card,
                            "p",
                            "The worker record is no longer available."
                        );
                    }

                } catch (workerError) {
                    console.error(
                        "Could not retrieve worker contact:",
                        workerError
                    );

                    addText(
                        card,
                        "p",
                        "Your request is approved, but the contact details could not be loaded."
                    );
                }

            } else if (request.status === "Rejected") {
                addText(
                    card,
                    "p",
                    "Your request was rejected."
                );

            } else {
                addText(
                    card,
                    "p",
                    "Your request is waiting for admin approval."
                );
            }

            results.appendChild(card);
        }

    } catch (error) {
        console.error("Status check error:", error);

        showMessage(
            results,
            "Unable to check status. Please try again.",
            "h3"
        );
    }
}

// ==========================================
// START: LOAD DATA ON EACH RELEVANT PAGE
// ==========================================

function initializeBesnosJobs() {
    loadWorkers();
    loadPublicWorkers();
    loadContactRequests();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeBesnosJobs
    );
} else {
    initializeBesnosJobs();
}
