
/* =====================================================
   BESNOS JOBS - MAIN JAVASCRIPT
   Worker Registration, Search, Admin & Contact Requests
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

function showMessage(elementId, message) {
    const element = getElement(elementId);

    if (element) {
        element.textContent = message;
    } else {
        alert(message);
    }
}

function addText(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text == null || text === ""
        ? "—"
        : String(text);

    if (className) {
        element.className = className;
    }

    parent.appendChild(element);
    return element;
}

function addDetail(parent, label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = label + ": ";
    paragraph.appendChild(strong);
    paragraph.appendChild(
        document.createTextNode(
            value == null || value === "" ? "—" : String(value)
        )
    );

    parent.appendChild(paragraph);
}

function makeButton(label, callback, className) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", callback);

    if (className) {
        button.className = className;
    }

    return button;
}

function makeCard() {
    const card = document.createElement("div");
    card.className = "card";
    return card;
}

function databaseAvailable() {
    if (
        typeof firebase === "undefined" ||
        typeof db === "undefined" ||
        !db
    ) {
        console.error(
            "Firebase is not ready. Check firebase.js and script loading order."
        );
        return false;
    }

    return true;
}

function workerJob(worker) {
    return worker.job || worker.jobType || worker.category || "";
}

function workerLocation(worker) {
    return [
        worker.city,
        worker.subcity,
        worker.region,
        worker.location,
        worker.address
    ].filter(Boolean).join(" ");
}


/* =====================================================
   2. WORKER REGISTRATION
===================================================== */

async function registerWorker(event) {
    if (event) {
        event.preventDefault();
    }

    if (!databaseAvailable()) {
        showMessage(
            "workerMessage",
            "Connection error. Please refresh the page and try again."
        );
        return;
    }

    const name = getValue("name");
    const age = getValue("age");
    const gender = getValue("gender");
    const phone = getValue("phone");
    const region = getValue("region");
    const city = getValue("city");
    const subcity = getValue("subcity");
    const job = getValue("job");
    const experience = getValue("experience");
    const languages = getValue("languages");
    const salary = getValue("salary");
    const availability = getValue("availability");

    if (!name || !phone || !job) {
        showMessage(
            "workerMessage",
            "Please enter your name, phone number, and job type."
        );
        return;
    }

    const worker = {
        name: name,
        age: age,
        gender: gender,
        phone: phone,
        region: region,
        city: city,
        subcity: subcity,
        job: job,
        experience: experience,
        languages: languages,
        salary: salary,
        availability: availability,
        status: "Pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("workers").add(worker);

        showMessage(
            "workerMessage",
            "Registration submitted successfully! Your profile is waiting for admin approval."
        );

        const form = getElement("workerForm");

        if (form) {
            form.reset();
        }
    } catch (error) {
        console.error("Worker registration error:", error);

        showMessage(
            "workerMessage",
            "Registration failed. Please check your internet connection or contact the administrator."
        );
    }
}


/* =====================================================
   3. ADMIN LOGIN
===================================================== */

/*
   IMPORTANT:
   This is the existing simple login for compatibility.
   It is NOT secure because credentials in JavaScript
   can be viewed by website visitors.

   Replace it with Firebase Authentication before using
   this site for sensitive or real administrative work.
*/

function adminLogin(event) {
    if (event) {
        event.preventDefault();
    }

    const username = getValue("username");
    const password = getValue("password");

    if (username === "admin" && password === "12345") {
        window.location.href = "admin.html";
    } else {
        showMessage(
            "loginMessage",
            "Incorrect username or password."
        );
    }
}


/* =====================================================
   4. ADMIN - LOAD WORKERS
===================================================== */

async function loadWorkers() {
    const workerList = getElement("workerList");

    if (!workerList || !databaseAvailable()) {
        return;
    }

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

            const approveButton = makeButton(
                "Approve",
                function () {
                    updateWorkerStatus(doc.id, "Approved");
                }
            );

            const rejectButton = makeButton(
                "Reject",
                function () {
                    updateWorkerStatus(doc.id, "Rejected");
                }
            );

            card.appendChild(approveButton);
            card.appendChild(rejectButton);
            workerList.appendChild(card);
        });
    } catch (error) {
        console.error("Loading workers failed:", error);

        workerList.replaceChildren();
        addText(
            workerList,
            "p",
            "Could not load workers. Check Firebase permissions and connection."
        );
    }
}

async function updateWorkerStatus(workerId, status) {
    if (!databaseAvailable()) {
        return;
    }

    try {
        await db.collection("workers")
            .doc(workerId)
            .update({ status: status });

        alert("Worker status updated to " + status + ".");

        await loadWorkers();
        await loadPublicWorkers();
    } catch (error) {
        console.error("Updating worker status failed:", error);

        alert(
            "Could not update worker status. Check your Firebase permissions."
        );
    }
}


/* =====================================================
   5. PUBLIC WORKER SEARCH
===================================================== */

let approvedWorkersCache = [];

async function loadPublicWorkers() {
    const publicWorkers = getElement("publicWorkers");

    if (!publicWorkers || !databaseAvailable()) {
        return;
    }

    publicWorkers.replaceChildren();
    addText(publicWorkers, "p", "Loading approved workers...");

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

        publicWorkers.replaceChildren();

        addText(
            publicWorkers,
            "p",
            "Could not load workers. Please refresh the page and try again."
        );
    }
}


/* Filter workers by job type AND location. */

function renderPublicWorkers() {
    const publicWorkers = getElement("publicWorkers");

    if (!publicWorkers) {
        return;
    }

    const jobInput = getElement("jobSearch");
    const locationInput = getElement("locationSearch");

    const jobQuery = normalize(jobInput ? jobInput.value : "");
    const locationQuery = normalize(
        locationInput ? locationInput.value : ""
    );

    const allJobsSelected = [
        "",
        "all",
        "all jobs",
        "any",
        "any job"
    ].includes(jobQuery);

    const filteredWorkers = approvedWorkersCache.filter(
        function (worker) {
            const job = normalize(workerJob(worker));

            const locationParts = [
                worker.city,
                worker.subcity,
                worker.region,
                worker.location,
                worker.address
            ].map(normalize).filter(Boolean);

            /*
             * Match partial job names.
             * Example: "clean" matches "Cleaner".
             */
            const matchesJob =
                allJobsSelected ||
                job.includes(jobQuery) ||
                jobQuery.includes(job);

            /*
             * Match any individual location field.
             * Example: Addis Ababa can match the city,
             * while Bole can match the subcity.
             */
            const matchesLocation =
                !locationQuery ||
                locationParts.some(function (part) {
                    return part.includes(locationQuery);
                });

            return matchesJob && matchesLocation;
        }
    );

    publicWorkers.replaceChildren();

    if (approvedWorkersCache.length === 0) {
        addText(
            publicWorkers,
            "p",
            "No approved workers available yet."
        );
        return;
    }

    if (filteredWorkers.length === 0) {
        addText(
            publicWorkers,
            "p",
            "No workers match your search. Try another job type or location."
        );
        return;
    }

    addText(
        publicWorkers,
        "p",
        filteredWorkers.length + " worker(s) found."
    );

    filteredWorkers.forEach(function (worker) {
        const card = makeCard();

        addText(card, "h3", worker.name || "Worker");
        addDetail(card, "Job", workerJob(worker));

        addDetail(
            card,
            "Location",
            [
                worker.city,
                worker.subcity,
                worker.region
            ].filter(Boolean).join(", ")
        );

        addDetail(card, "Experience", worker.experience);
        addDetail(card, "Languages", worker.languages);
        addDetail(card, "Availability", worker.availability);

        const contactButton = makeButton(
            "Request Contact",
            function () {
                requestContact(worker.id, worker.name || "Worker");
            }
        );

        card.appendChild(contactButton);
        publicWorkers.appendChild(card);
    });
}


/* Called by the Search button. */

function searchWorkers(event) {
    if (event) {
        event.preventDefault();
    }

    renderPublicWorkers();
}


/* =====================================================
   6. EMPLOYER - REQUEST WORKER CONTACT
===================================================== */

async function requestContact(workerId, workerName) {
    const requestPage = "request-contact.html";

    const requestForm = getElement("requestContactForm");

    /*
     * If a separate contact-request form is not on this
     * page, open the contact request page.
     */
    if (!requestForm) {
        const url = new URL(requestPage, window.location.href);

        url.searchParams.set("workerId", workerId);
        url.searchParams.set("workerName", workerName);

        window.location.href = url.href;
        return;
    }

    const workerIdInput = getElement("workerId");
    const workerNameInput = getElement("workerName");

    if (workerIdInput) {
        workerIdInput.value = workerId;
    }

    if (workerNameInput) {
        workerNameInput.value = workerName;
    }
}

async function submitContactRequest(event) {
    if (event) {
        event.preventDefault();
    }

    if (!databaseAvailable()) {
        showMessage(
            "requestMessage",
            "Connection error. Please try again."
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

    const selectedWorkerName =
        getValue("workerName") ||
        getValue("selectedWorkerName");

    const message =
        getValue("requestMessage") ||
        getValue("message");

    if (!employerName || !employerPhone || !selectedWorkerName) {
        showMessage(
            "requestMessage",
            "Please enter your name, phone number, and the worker you want to contact."
        );
        return;
    }

    try {
        await db.collection("contactRequests").add({
            employerName: employerName,
            employerPhone: employerPhone,
            workerId: workerId,
            workerName: selectedWorkerName,
            message: message,
            status: "Pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(
            "requestMessage",
            "Your request has been submitted. Please wait for admin approval."
        );

        const form = getElement("requestContactForm");

        if (form) {
            form.reset();
        }
    } catch (error) {
        console.error("Contact request failed:", error);

        showMessage(
            "requestMessage",
            "Could not send your request. Please try again."
        );
    }
}


/* =====================================================
   7. ADMIN - LOAD CONTACT REQUESTS
===================================================== */

async function loadContactRequests() {
    const requestList = getElement("requestList");

    if (!requestList || !databaseAvailable()) {
        return;
    }

    requestList.replaceChildren();
    addText(requestList, "p", "Loading contact requests...");

    try {
        const snapshot = await db.collection("contactRequests").get();

        requestList.replaceChildren();

        if (snapshot.empty) {
            addText(requestList, "p", "No contact requests yet.");
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

            const approveButton = makeButton(
                "Approve Request",
                function () {
                    updateContactRequestStatus(doc.id, "Approved");
                }
            );

            const rejectButton = makeButton(
                "Reject Request",
                function () {
                    updateContactRequestStatus(doc.id, "Rejected");
                }
            );

            card.appendChild(approveButton);
            card.appendChild(rejectButton);
            requestList.appendChild(card);
        });
    } catch (error) {
        console.error("Loading contact requests failed:", error);

        requestList.replaceChildren();

        addText(
            requestList,
            "p",
            "Could not load contact requests. Check Firebase permissions."
        );
    }
}

async function updateContactRequestStatus(requestId, status) {
    if (!databaseAvailable()) {
        return;
    }

    try {
        await db.collection("contactRequests")
            .doc(requestId)
            .update({ status: status });

        alert("Contact request " + status.toLowerCase() + ".");

        await loadContactRequests();
    } catch (error) {
        console.error("Updating contact request failed:", error);

        alert(
            "Could not update the request. Check your Firebase permissions."
        );
    }
}


/* =====================================================
   8. EMPLOYER - CHECK REQUEST STATUS
===================================================== */

async function checkStatus(event) {
    if (event) {
        event.preventDefault();
    }

    if (!databaseAvailable()) {
        showMessage(
            "statusResults",
            "Connection error. Please try again."
        );
        return;
    }

    const phone =
        getValue("statusPhoneSearch") ||
        getValue("statusPhone") ||
        getValue("phoneSearch");

    const statusResults = getElement("statusResults");

    if (!phone) {
        showMessage(
            "statusResults",
            "Please enter the phone number used for your request."
        );
        return;
    }

    if (statusResults) {
        statusResults.replaceChildren();
        addText(statusResults, "p", "Checking your requests...");
    }

    try {
        const snapshot = await db.collection("contactRequests").get();

        const matchingRequests = [];

        snapshot.forEach(function (doc) {
            const request = doc.data();

            if (
                normalize(request.employerPhone) === normalize(phone)
            ) {
                matchingRequests.push(request);
            }
        });

        if (statusResults) {
            statusResults.replaceChildren();
        }

        if (matchingRequests.length === 0) {
            showMessage(
                "statusResults",
                "No requests found for this phone number."
            );
            return;
        }

        matchingRequests.forEach(async function (request) {
            const card = makeCard();

            addDetail(card, "Worker", request.workerName);
            addDetail(card, "Request Status", request.status || "Pending");

            if (normalize(request.status) === "approved") {
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
                        addDetail(card, "Worker Phone", worker.phone);
                    } else {
                        addText(
                            card,
                            "p",
                            "Your request is approved, but the worker's phone number could not be found."
                        );
                    }
                } catch (error) {
                    console.error("Loading worker contact failed:", error);

                    addText(
                        card,
                        "p",
                        "Your request is approved, but the contact details could not be loaded."
                    );
                }
            } else if (normalize(request.status) === "pending") {
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
            }

            if (statusResults) {
                statusResults.appendChild(card);
            }
        });
    } catch (error) {
        console.error("Checking request status failed:", error);

        showMessage(
            "statusResults",
            "Could not check your request. Please try again."
        );
    }
}


/* =====================================================
   9. CONNECT HTML FORMS AND BUTTONS
===================================================== */

function initializeBesnosJobs() {
    /*
     * Worker registration
     */
    const workerForm = getElement("workerForm");

    if (workerForm) {
        workerForm.addEventListener("submit", registerWorker);
    }

    /*
     * Worker search
     */
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

    /*
     * Update results while typing.
     */
    if (jobSearch) {
        jobSearch.addEventListener("input", renderPublicWorkers);
        jobSearch.addEventListener("change", renderPublicWorkers);
    }

    if (locationSearch) {
        locationSearch.addEventListener("input", renderPublicWorkers);
    }

    /*
     * Contact request form
     */
    const requestForm = getElement("requestContactForm");

    if (requestForm) {
        requestForm.addEventListener("submit", submitContactRequest);
    }

    /*
     * Check request status form
     */
    const statusForm = getElement("statusForm");

    if (statusForm) {
        statusForm.addEventListener("submit", checkStatus);
    }

    /*
     * Support existing inline HTML button handlers.
     */
    if (getElement("workerList")) {
        loadWorkers();
    }

    if (getElement("publicWorkers")) {
        loadPublicWorkers();
    }

    if (getElement("requestList")) {
        loadContactRequests();
    }

    /*
     * Fill the selected worker from the contact page URL.
     */
    const params = new URLSearchParams(window.location.search);

    const workerIdInput = getElement("workerId");
    const workerNameInput = getElement("workerName");

    if (workerIdInput && params.has("workerId")) {
        workerIdInput.value = params.get("workerId");
    }

    if (workerNameInput && params.has("workerName")) {
        workerNameInput.value = params.get("workerName");
    }
}


/* =====================================================
   10. START THE WEBSITE SCRIPT
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeBesnosJobs
    );
} else {
    initializeBesnosJobs();
}
