// ==========================================
// BESNOS JOBS - SCRIPT.JS
// ==========================================


// ==========================================
// WORKER REGISTRATION
// ==========================================

const workerForm = document.getElementById("workerForm");

if (workerForm) {

    workerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const worker = {

            name: document.getElementById("name").value.trim(),

            age: document.getElementById("age").value,

            gender: document.getElementById("gender").value,

            phone: document.getElementById("phone").value.trim(),

            region: document.getElementById("region").value.trim(),

            city: document.getElementById("city").value.trim(),

            subcity: document.getElementById("subcity").value.trim(),

            job: document.getElementById("job").value,

            experience:
                document.getElementById("experience").value,

            languages:
                document.getElementById("languages").value.trim(),

            salary:
                document.getElementById("salary").value,

            availability:
                document.getElementById("availability").value,

            status: "Pending",

            createdAt: new Date()

        };


        try {

            await db
                .collection("workers")
                .add(worker);


            alert(
                "Worker registration submitted!"
            );


            workerForm.reset();

        }

        catch (error) {

            console.error(
                "Worker registration error:",
                error
            );


            alert(
                "Registration failed. Please try again."
            );

        }

    });

}


// ==========================================
// ADMIN LOGIN
// ==========================================

function adminLogin() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;


    if (
        username === "admin" &&
        password === "12345"
    ) {

        window.location.href = "admin.html";

    }

    else {

        alert(
            "Wrong username or password"
        );

    }

}


// ==========================================
// LOAD WORKERS FOR ADMIN
// ==========================================

async function loadWorkers() {

    const workerList =
        document.getElementById("workerList");


    if (!workerList) {
        return;
    }


    try {

        const snapshot =
            await db
                .collection("workers")
                .get();


        workerList.innerHTML = "";


        if (snapshot.empty) {

            workerList.innerHTML =
                "<h3>No worker registrations yet.</h3>";

            return;

        }


        snapshot.forEach(function(doc) {

            const worker = doc.data();


            workerList.innerHTML += `

                <div class="card">

                    <h3>${worker.name || ""}</h3>

                    <p>
                        <strong>Age:</strong>
                        ${worker.age || ""}
                    </p>

                    <p>
                        <strong>Gender:</strong>
                        ${worker.gender || ""}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${worker.phone || ""}
                    </p>

                    <p>
                        <strong>Region:</strong>
                        ${worker.region || ""}
                    </p>

                    <p>
                        <strong>City:</strong>
                        ${worker.city || ""}
                    </p>

                    <p>
                        <strong>Sub-city:</strong>
                        ${worker.subcity || ""}
                    </p>

                    <p>
                        <strong>Job:</strong>
                        ${worker.job || ""}
                    </p>

                    <p>
                        <strong>Experience:</strong>
                        ${worker.experience || 0} years
                    </p>

                    <p>
                        <strong>Languages:</strong>
                        ${worker.languages || ""}
                    </p>

                    <p>
                        <strong>Expected Salary:</strong>
                        ${worker.salary || 0} ETB
                    </p>

                    <p>
                        <strong>Availability:</strong>
                        ${worker.availability || ""}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${worker.status || "Pending"}
                    </p>


                    <button
                        onclick="approveWorker(
                            '${doc.id}',
                            '${worker.name || ""}'
                        )"
                    >
                        Approve
                    </button>


                    <button
                        onclick="rejectWorker(
                            '${doc.id}',
                            '${worker.name || ""}'
                        )"
                    >
                        Reject
                    </button>

                </div>

            `;

        });

    }

    catch (error) {

        console.error(error);

        workerList.innerHTML =
            "<h3>Unable to load workers.</h3>";

    }

}


// ==========================================
// APPROVE WORKER
// ==========================================

async function approveWorker(id, name) {

    try {

        await db
            .collection("workers")
            .doc(id)
            .update({
                status: "Approved"
            });


        alert(
            name + " has been approved!"
        );


        loadWorkers();

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not approve worker."
        );

    }

}


// ==========================================
// REJECT WORKER
// ==========================================

async function rejectWorker(id, name) {

    try {

        await db
            .collection("workers")
            .doc(id)
            .update({
                status: "Rejected"
            });


        alert(
            name + " has been rejected!"
        );


        loadWorkers();

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not reject worker."
        );

    }

}


// ==========================================
// LOAD APPROVED WORKERS
// ==========================================

async function loadPublicWorkers() {

    const publicWorkers =
        document.getElementById("publicWorkers");


    if (!publicWorkers) {
        return;
    }


    try {

        const snapshot =
            await db
                .collection("workers")
                .where(
                    "status",
                    "==",
                    "Approved"
                )
                .get();


        publicWorkers.innerHTML = "";


        if (snapshot.empty) {

            publicWorkers.innerHTML =
                "<h3>No approved workers available.</h3>";

            return;

        }


        snapshot.forEach(function(doc) {

            const worker = doc.data();


            publicWorkers.innerHTML += `

                <div class="card">

                    <h3>${worker.name || ""}</h3>

                    <p>
                        <strong>Job:</strong>
                        ${worker.job || ""}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${worker.city || ""},
                        ${worker.region || ""}
                    </p>

                    <p>
                        <strong>Experience:</strong>
                        ${worker.experience || 0} years
                    </p>

                    <p>
                        <strong>Languages:</strong>
                        ${worker.languages || ""}
                    </p>

                    <p>
                        <strong>Availability:</strong>
                        ${worker.availability || ""}
                    </p>

                    <p>
                        ✅ Verified Worker
                    </p>


                    <button
                        onclick="requestContact(
                            '${doc.id}',
                            '${worker.name || ""}'
                        )"
                    >
                        Request Contact
                    </button>

                </div>

            `;

        });

    }

    catch (error) {

        console.error(error);

        publicWorkers.innerHTML =
            "<h3>Unable to load workers.</h3>";

    }

}


// ==========================================
// REQUEST CONTACT
// ==========================================

async function requestContact(
    workerId,
    workerName
) {

    const employerName =
        prompt(
            "Enter your full name:"
        );


    if (!employerName) {
        return;
    }


    const employerPhone =
        prompt(
            "Enter your phone number:"
        );


    if (!employerPhone) {
        return;
    }


    try {

        await db
            .collection("contactRequests")
            .add({

                employerName:
                    employerName.trim(),

                employerPhone:
                    employerPhone.trim(),

                workerId:
                    workerId,

                workerName:
                    workerName,

                status:
                    "Pending",

                createdAt:
                    new Date()

            });


        alert(
            "Your request to contact " +
            workerName +
            " has been submitted!"
        );

    }

    catch (error) {

        console.error(
            "Contact request error:",
            error
        );


        alert(
            "Request could not be saved."
        );

    }

}


// ==========================================
// LOAD CONTACT REQUESTS
// ==========================================

async function loadContactRequests() {

    const requestList =
        document.getElementById("requestList");


    if (!requestList) {
        return;
    }


    try {

        const snapshot =
            await db
                .collection("contactRequests")
                .get();


        requestList.innerHTML = "";


        if (snapshot.empty) {

            requestList.innerHTML =
                "<h3>No contact requests yet.</h3>";

            return;

        }


        snapshot.forEach(function(doc) {

            const request = doc.data();


            requestList.innerHTML += `

                <div class="card">

                    <h3>Contact Request</h3>

                    <p>
                        <strong>Employer:</strong>
                        ${request.employerName || ""}
                    </p>

                    <p>
                        <strong>Employer Phone:</strong>
                        ${request.employerPhone || ""}
                    </p>

                    <p>
                        <strong>Worker:</strong>
                        ${request.workerName || ""}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${request.status || "Pending"}
                    </p>


                    <button
                        onclick="approveRequest(
                            '${doc.id}'
                        )"
                    >
                        Approve Request
                    </button>


                    <button
                        onclick="rejectRequest(
                            '${doc.id}'
                        )"
                    >
                        Reject Request
                    </button>

                </div>

            `;

        });

    }

    catch (error) {

        console.error(error);

        requestList.innerHTML =
            "<h3>Unable to load contact requests.</h3>";

    }

}


// ==========================================
// APPROVE CONTACT REQUEST
// ==========================================

async function approveRequest(id) {

    try {

        await db
            .collection("contactRequests")
            .doc(id)
            .update({
                status: "Approved"
            });


        alert(
            "Contact request approved!"
        );


        loadContactRequests();

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not approve request."
        );

    }

}


// ==========================================
// REJECT CONTACT REQUEST
// ==========================================

async function rejectRequest(id) {

    try {

        await db
            .collection("contactRequests")
            .doc(id)
            .update({
                status: "Rejected"
            });


        alert(
            "Contact request rejected!"
        );


        loadContactRequests();

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not reject request."
        );

    }

}


// ==========================================
// CHECK REQUEST STATUS
// ==========================================

async function checkStatus() {

    const phoneInput =
        document.getElementById(
            "statusPhoneSearch"
        );


    const results =
        document.getElementById(
            "statusResults"
        );


    if (!phoneInput || !results) {
        return;
    }


    const phone =
        phoneInput.value.trim();


    if (!phone) {

        results.innerHTML =
            "<h3>Please enter your phone number.</h3>";

        return;

    }


    results.innerHTML =
        "<h3>Checking...</h3>";


    try {

        const snapshot =
            await db
                .collection("contactRequests")
                .where(
                    "employerPhone",
                    "==",
                    phone
                )
                .get();


        results.innerHTML = "";


        if (snapshot.empty) {

            results.innerHTML = `

                <h3>No request found.</h3>

                <p>
                    Please check your phone number
                    and try again.
                </p>

            `;

            return;

        }


        for (
            const doc of snapshot.docs
        ) {

            const request =
                doc.data();


            let workerPhone = "";


            if (
                request.status === "Approved"
            ) {

                const workerDoc =
                    await db
                        .collection("workers")
                        .doc(request.workerId)
                        .get();


                if (
                    workerDoc.exists
                ) {

                    const worker =
                        workerDoc.data();


                    workerPhone =
                        worker.phone || "";

                }

            }


            results.innerHTML += `

                <div class="card">

                    <h3>
                        Contact Request
                    </h3>

                    <p>
                        <strong>
                            Worker:
                        </strong>

                        ${request.workerName || ""}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>

                        ${request.status || "Pending"}
                    </p>


                    ${
                        request.status === "Approved"

                        ? `

                            <p>
                                <strong>
                                    Worker Phone:
                                </strong>

                                ${workerPhone}
                            </p>

                            <p>
                                ✅ You can now
                                contact the worker.
                            </p>

                        `

                        : request.status === "Rejected"

                        ? `

                            <p>
                                ❌ Your request
                                was rejected.
                            </p>

                        `

                        : `

                            <p>
                                ⏳ Your request is
                                waiting for admin
                                approval.
                            </p>

                        `
                    }

                </div>

            `;

        }

    }

    catch (error) {

        console.error(
            "Status check error:",
            error
        );


        results.innerHTML =
            "<h3>Unable to check status.</h3>";

    }

}


// ==========================================
// START
// ==========================================

loadWorkers();

loadPublicWorkers();

loadContactRequests();