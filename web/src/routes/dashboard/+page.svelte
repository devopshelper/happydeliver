<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { listTests, createTest as apiCreateTest, uploadEml } from "$lib/api";
    import type { TestSummary } from "$lib/api/types.gen";
    import GradeDisplay from "$lib/components/GradeDisplay.svelte";
    import { appConfig } from "$lib/stores/config";
    import { theme } from "$lib/stores/theme";

    type ExtendedTest = TestSummary & {
        id?: string;
        from?: string;
        subject?: string;
        spf_status?: "pass" | "fail" | "neutral" | "none";
        dkim_status?: "pass" | "fail" | "neutral" | "none";
        dmarc_status?: "pass" | "fail" | "neutral" | "none";
    };

    let tests = $state<ExtendedTest[]>([]);
    let total = $state(0);
    let loading = $state(true);
    let refreshing = $state(false);
    let error = $state<string | null>(null);
    let creatingTest = $state(false);
    let uploadingEml = $state(false);
    let uploadError = $state<string | null>(null);

    // Search and filter state
    let searchQuery = $state("");
    let selectedGrade = $state<string>("all");
    let selectedSource = $state<string>("all");
    let sortBy = $state<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc");
    let viewMode = $state<"cards" | "table">("cards");

    let fileInputElement: HTMLInputElement | undefined = $state();

    async function loadTests(isRefresh = false) {
        if (isRefresh) {
            refreshing = true;
        } else {
            loading = true;
        }
        error = null;

        try {
            const response = await listTests({ query: { offset: 0, limit: 100 } });
            if (response.data) {
                tests = (response.data.tests as ExtendedTest[]) || [];
                total = response.data.total ?? tests.length;
            } else if (response.error) {
                if (
                    typeof response.error === "object" &&
                    "error" in response.error &&
                    response.error.error === "feature_disabled"
                ) {
                    error = "Test listing is disabled on this instance.";
                } else {
                    error = "Failed to load recent test results.";
                }
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to load test results.";
        } finally {
            loading = false;
            refreshing = false;
        }
    }

    $effect(() => {
        loadTests();
    });

    async function handleCreateTest() {
        creatingTest = true;
        error = null;
        try {
            const response = await apiCreateTest();
            if (response.data) {
                goto(resolve("/test/[test]", { test: response.data.id }));
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to create new test";
            creatingTest = false;
        }
    }

    async function handleFileSelected(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        input.value = "";

        if (!file) return;

        uploadingEml = true;
        uploadError = null;
        try {
            const response = await uploadEml({ body: { file } });
            if (response.data) {
                goto(resolve("/test/[test]", { test: response.data.id }));
                return;
            }
            uploadError = response.error?.message ?? "Failed to analyze .eml file";
        } catch (err) {
            uploadError = err instanceof Error ? err.message : "Failed to analyze .eml file";
        } finally {
            uploadingEml = false;
        }
    }

    function getTestId(test: ExtendedTest, index: number): string {
        return test.test_id || test.id || `test-${index}`;
    }

    function formatRelativeDate(isoString: string): string {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffHour = Math.floor(diffMin / 60);
            const diffDays = Math.floor(diffHour / 24);

            if (diffMin < 2) return "Just now";
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHour < 24) return `${diffHour}h ago`;
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
            });
        } catch {
            return isoString;
        }
    }

    function formatExactDate(isoString: string): string {
        try {
            return new Date(isoString).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
            });
        } catch {
            return isoString;
        }
    }

    function getScoreColorClass(score: number): string {
        if (score >= 90) return "text-success";
        if (score >= 80) return "text-primary";
        if (score >= 70) return "text-warning";
        return "text-danger";
    }

    function getScoreProgressClass(score: number): string {
        if (score >= 90) return "bg-success";
        if (score >= 80) return "bg-primary";
        if (score >= 70) return "bg-warning";
        return "bg-danger";
    }

    function getScoreTierLabel(score: number): string {
        if (score >= 90) return "Optimal Deliverability";
        if (score >= 80) return "Good Deliverability";
        if (score >= 70) return "Moderate Risk";
        return "High Deliverability Risk";
    }

    // Analytics calculations derived from test results
    let averageScore = $derived.by(() => {
        if (tests.length === 0) return 0;
        const sum = tests.reduce((acc, t) => acc + (t.score || 0), 0);
        return Math.round(sum / tests.length);
    });

    let highGradeCount = $derived.by(() => {
        return tests.filter((t) => t.grade === "A+" || t.grade === "A").length;
    });

    let highGradeRate = $derived.by(() => {
        if (tests.length === 0) return 0;
        return Math.round((highGradeCount / tests.length) * 100);
    });

    let spfPassRate = $derived.by(() => {
        if (tests.length === 0) return 0;
        const passed = tests.filter((t) => t.spf_status === "pass").length;
        return Math.round((passed / tests.length) * 100);
    });

    let dkimPassRate = $derived.by(() => {
        if (tests.length === 0) return 0;
        const passed = tests.filter((t) => t.dkim_status === "pass").length;
        return Math.round((passed / tests.length) * 100);
    });

    let dmarcPassRate = $derived.by(() => {
        if (tests.length === 0) return 0;
        const passed = tests.filter((t) => t.dmarc_status === "pass").length;
        return Math.round((passed / tests.length) * 100);
    });

    let gradeCounts = $derived.by(() => {
        const counts: Record<string, number> = {
            "A+": 0,
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            E: 0,
            F: 0,
        };
        for (const t of tests) {
            const g = t.grade || "A";
            if (g in counts) {
                counts[g]++;
            }
        }
        return counts;
    });

    // Filtered and sorted test list
    let filteredTests = $derived.by(() => {
        let result = [...tests];

        // Search query filter (domain, from, subject, test_id)
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter((t) => {
                const domain = (t.from_domain || "").toLowerCase();
                const from = (t.from || "").toLowerCase();
                const subject = (t.subject || "").toLowerCase();
                const id = (t.test_id || t.id || "").toLowerCase();
                return (
                    domain.includes(q) || from.includes(q) || subject.includes(q) || id.includes(q)
                );
            });
        }

        // Grade filter
        if (selectedGrade !== "all") {
            if (selectedGrade === "high") {
                result = result.filter((t) => t.grade === "A+" || t.grade === "A");
            } else if (selectedGrade === "medium") {
                result = result.filter((t) => t.grade === "B" || t.grade === "C");
            } else if (selectedGrade === "low") {
                result = result.filter(
                    (t) => t.grade === "D" || t.grade === "E" || t.grade === "F",
                );
            } else {
                result = result.filter((t) => t.grade === selectedGrade);
            }
        }

        // Source filter
        if (selectedSource !== "all") {
            result = result.filter((t) => (t.source || "received") === selectedSource);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "date_desc") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            if (sortBy === "date_asc") {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            if (sortBy === "score_desc") {
                return (b.score || 0) - (a.score || 0);
            }
            if (sortBy === "score_asc") {
                return (a.score || 0) - (b.score || 0);
            }
            return 0;
        });

        return result;
    });

    function clearFilters() {
        searchQuery = "";
        selectedGrade = "all";
        selectedSource = "all";
        sortBy = "date_desc";
    }
</script>

<svelte:head>
    <title>Deliverability Dashboard - happyDeliver</title>
</svelte:head>

<div class="container py-4 py-md-5">
    <!-- Header with Title & Quick Actions -->
    <div
        class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom"
    >
        <div>
            <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1">
                    <i class="bi bi-speedometer2 me-1"></i> Monitoring
                </span>
                <span class="text-muted small">Live Deliverability Metrics</span>
            </div>
            <h1 class="display-6 fw-bold mb-1">Deliverability Dashboard</h1>
            <p class="text-muted mb-0">
                Recent email inbox placement reports, authentication validation, and score health.
            </p>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
            <button
                id="btn-refresh-dashboard"
                class="btn btn-outline-secondary d-flex align-items-center gap-1"
                onclick={() => loadTests(true)}
                disabled={refreshing || loading}
                title="Refresh results"
            >
                <i class="bi bi-arrow-clockwise {refreshing ? 'spin' : ''}"></i>
                <span>Refresh</span>
            </button>

            {#if $appConfig.eml_upload_enabled}
                <input
                    type="file"
                    accept=".eml,message/rfc822"
                    class="d-none"
                    bind:this={fileInputElement}
                    onchange={handleFileSelected}
                />
                <button
                    id="btn-upload-eml-dashboard"
                    class="btn btn-outline-primary d-flex align-items-center gap-1"
                    onclick={() => fileInputElement?.click()}
                    disabled={uploadingEml}
                >
                    {#if uploadingEml}
                        <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                        <span>Analyzing...</span>
                    {:else}
                        <i class="bi bi-file-earmark-arrow-up"></i>
                        <span>Upload .eml</span>
                    {/if}
                </button>
            {/if}

            <button
                id="btn-new-test-dashboard"
                class="btn btn-primary d-flex align-items-center gap-1"
                onclick={handleCreateTest}
                disabled={creatingTest}
            >
                {#if creatingTest}
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    <span>Creating...</span>
                {:else}
                    <i class="bi bi-plus-lg"></i>
                    <span>New Email Test</span>
                {/if}
            </button>
        </div>
    </div>

    <!-- Upload Error Notice -->
    {#if uploadError}
        <div class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {uploadError}
            <button
                type="button"
                class="btn-close"
                onclick={() => (uploadError = null)}
                aria-label="Close"
            ></button>
        </div>
    {/if}

    <!-- High-level Metric KPI Cards -->
    <div class="row g-3 mb-4">
        <!-- Average Score KPI Card -->
        <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 bg-body-tertiary">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small fw-semibold text-uppercase tracking-wider">
                            Avg Deliverability
                        </span>
                        <div class="p-2 rounded bg-primary bg-opacity-10 text-primary">
                            <i class="bi bi-graph-up-arrow"></i>
                        </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2 mb-2">
                        <span class="display-6 fw-bold {getScoreColorClass(averageScore)}">
                            {averageScore}%
                        </span>
                        <span class="text-muted small">/ 100</span>
                    </div>
                    <div class="progress mb-2" style="height: 6px;">
                        <div
                            class="progress-bar {getScoreProgressClass(averageScore)}"
                            role="progressbar"
                            style="width: {averageScore}%;"
                            aria-valuenow={averageScore}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>
                    </div>
                    <small class="text-muted d-block">
                        <i class="bi bi-shield-check me-1 text-success"></i>
                        {getScoreTierLabel(averageScore)}
                    </small>
                </div>
            </div>
        </div>

        <!-- Total Tests Analyzed KPI Card -->
        <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 bg-body-tertiary">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small fw-semibold text-uppercase tracking-wider">
                            Tests Analyzed
                        </span>
                        <div class="p-2 rounded bg-info bg-opacity-10 text-info">
                            <i class="bi bi-inbox-fill"></i>
                        </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2 mb-2">
                        <span class="display-6 fw-bold">
                            {total}
                        </span>
                        <span class="text-muted small">total reports</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 text-muted small mt-3">
                        <i class="bi bi-clock-history"></i>
                        <span>Across active domains</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- High Grade Rate (A+/A) KPI Card -->
        <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 bg-body-tertiary">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small fw-semibold text-uppercase tracking-wider">
                            Grade A / A+ Rate
                        </span>
                        <div class="p-2 rounded bg-success bg-opacity-10 text-success">
                            <i class="bi bi-award-fill"></i>
                        </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2 mb-2">
                        <span class="display-6 fw-bold text-success">
                            {highGradeRate}%
                        </span>
                        <span class="text-muted small">({highGradeCount} of {tests.length})</span>
                    </div>
                    <div class="progress mb-2" style="height: 6px;">
                        <div
                            class="progress-bar bg-success"
                            role="progressbar"
                            style="width: {highGradeRate}%;"
                            aria-valuenow={highGradeRate}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>
                    </div>
                    <small class="text-muted d-block">
                        Emails meeting primary inbox criteria
                    </small>
                </div>
            </div>
        </div>

        <!-- Auth Health Check Summary KPI Card -->
        <div class="col-12 col-sm-6 col-lg-3">
            <div class="card h-100 shadow-sm border-0 bg-body-tertiary">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small fw-semibold text-uppercase tracking-wider">
                            Authentication Health
                        </span>
                        <div class="p-2 rounded bg-secondary bg-opacity-10 text-secondary">
                            <i class="bi bi-check2-all"></i>
                        </div>
                    </div>
                    <div class="d-flex flex-column gap-1 mt-1">
                        <div class="d-flex justify-content-between align-items-center small">
                            <span class="fw-semibold">SPF Pass:</span>
                            <span class="badge bg-success bg-opacity-10 text-success"
                                >{spfPassRate}%</span
                            >
                        </div>
                        <div class="d-flex justify-content-between align-items-center small">
                            <span class="fw-semibold">DKIM Pass:</span>
                            <span class="badge bg-success bg-opacity-10 text-success"
                                >{dkimPassRate}%</span
                            >
                        </div>
                        <div class="d-flex justify-content-between align-items-center small">
                            <span class="fw-semibold">DMARC Pass:</span>
                            <span
                                class="badge {dmarcPassRate >= 80
                                    ? 'bg-success text-success'
                                    : 'bg-warning text-dark'} bg-opacity-10"
                            >
                                {dmarcPassRate}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Grade Breakdown Pills Bar -->
    <div class="card shadow-sm border-0 mb-4 bg-body-tertiary">
        <div class="card-body p-3">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold small text-muted text-uppercase tracking-wider">
                        Grade Distribution:
                    </span>
                    <button
                        class="btn btn-sm {selectedGrade === 'all'
                            ? 'btn-primary'
                            : 'btn-outline-secondary'}"
                        onclick={() => (selectedGrade = "all")}
                    >
                        All ({tests.length})
                    </button>
                </div>

                <div class="d-flex flex-wrap gap-2">
                    {#each Object.entries(gradeCounts) as [gradeKey, count] (gradeKey)}
                        <button
                            class="btn btn-sm d-flex align-items-center gap-1 {selectedGrade ===
                            gradeKey
                                ? 'btn-dark'
                                : 'btn-outline-secondary'}"
                            onclick={() =>
                                (selectedGrade = selectedGrade === gradeKey ? "all" : gradeKey)}
                            title="Filter by grade {gradeKey}"
                        >
                            <span class="fw-bold">{gradeKey}</span>
                            <span class="badge bg-secondary bg-opacity-25 text-body">{count}</span>
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <!-- Search, Filter & Controls Toolbar -->
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-body p-3">
            <div class="row g-2 align-items-center">
                <!-- Search Input -->
                <div class="col-12 col-md-5">
                    <div class="input-group">
                        <span class="input-group-text bg-body-tertiary border-end-0">
                            <i class="bi bi-search text-muted"></i>
                        </span>
                        <input
                            type="text"
                            class="form-control border-start-0"
                            placeholder="Search by domain, sender, subject, or test ID..."
                            bind:value={searchQuery}
                        />
                        {#if searchQuery}
                            <button
                                class="btn btn-outline-secondary border-start-0"
                                type="button"
                                onclick={() => (searchQuery = "")}
                            >
                                <i class="bi bi-x-lg"></i>
                            </button>
                        {/if}
                    </div>
                </div>

                <!-- Source Filter -->
                <div class="col-6 col-md-2">
                    <select class="form-select" bind:value={selectedSource} aria-label="Filter by source">
                        <option value="all">All Sources</option>
                        <option value="received">Received (SMTP)</option>
                        <option value="uploaded">Uploaded (.eml)</option>
                    </select>
                </div>

                <!-- Sort Selector -->
                <div class="col-6 col-md-3">
                    <select class="form-select" bind:value={sortBy} aria-label="Sort test results">
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="score_desc">Highest Score</option>
                        <option value="score_asc">Lowest Score</option>
                    </select>
                </div>

                <!-- View Toggle & Clear -->
                <div class="col-12 col-md-2 d-flex justify-content-end align-items-center gap-2">
                    {#if searchQuery || selectedGrade !== "all" || selectedSource !== "all"}
                        <button
                            class="btn btn-sm btn-link text-decoration-none text-danger p-0 me-2"
                            onclick={clearFilters}
                        >
                            Reset
                        </button>
                    {/if}
                    <div class="btn-group" role="group" aria-label="View toggle">
                        <button
                            type="button"
                            class="btn btn-sm {viewMode === 'cards'
                                ? 'btn-primary'
                                : 'btn-outline-secondary'}"
                            onclick={() => (viewMode = "cards")}
                            title="Card View"
                            aria-label="Card View"
                        >
                            <i class="bi bi-grid-fill"></i>
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm {viewMode === 'table'
                                ? 'btn-primary'
                                : 'btn-outline-secondary'}"
                            onclick={() => (viewMode = "table")}
                            title="Table View"
                            aria-label="Table View"
                        >
                            <i class="bi bi-list-ul"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Result Count Line -->
            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                <small class="text-muted">
                    Showing <strong>{filteredTests.length}</strong>
                    {filteredTests.length === 1 ? "test" : "tests"}
                    {#if filteredTests.length !== tests.length}
                        (filtered from {tests.length} total)
                    {/if}
                </small>
                {#if selectedGrade !== "all"}
                    <span class="badge bg-secondary">
                        Filter: Grade {selectedGrade}
                        <button
                            class="btn-close btn-close-white btn-close-xs ms-1"
                            onclick={() => (selectedGrade = "all")}
                            aria-label="Clear grade filter"
                        ></button>
                    </span>
                {/if}
            </div>
        </div>
    </div>

    <!-- Main Content Area: Loading / Error / Empty / Tests List -->
    {#if loading}
        <div class="text-center py-5 my-4">
            <div
                class="spinner-border text-primary"
                role="status"
                style="width: 3.5rem; height: 3.5rem;"
            >
                <span class="visually-hidden">Loading tests...</span>
            </div>
            <h3 class="h5 mt-3 text-muted">Loading Deliverability Test Results...</h3>
            <p class="text-muted small">Fetching latest reports from this server</p>
        </div>
    {:else if error}
        <div class="alert alert-warning text-center py-4 my-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill fs-2 d-block mb-2 text-warning"></i>
            <h4 class="alert-heading h5">{error}</h4>
            <p class="mb-3 text-muted">
                Could not retrieve test results. Ensure the server is reachable.
            </p>
            <button class="btn btn-outline-primary" onclick={() => loadTests()}>
                <i class="bi bi-arrow-clockwise me-1"></i> Retry
            </button>
        </div>
    {:else if tests.length === 0}
        <div class="card shadow-sm border-0 text-center py-5 my-4">
            <div class="card-body">
                <i class="bi bi-envelope-open display-1 text-muted mb-3 d-block"></i>
                <h2 class="h4 fw-bold mb-2">No Deliverability Tests Yet</h2>
                <p class="text-muted mb-4 mx-auto" style="max-width: 500px;">
                    Send an email to a generated test mailbox or upload an .eml message to receive a
                    comprehensive SPF, DKIM, DMARC, and content deliverability report.
                </p>
                <div class="d-flex justify-content-center gap-2">
                    <button
                        class="btn btn-primary btn-lg d-flex align-items-center gap-2"
                        onclick={handleCreateTest}
                        disabled={creatingTest}
                    >
                        <i class="bi bi-plus-circle"></i>
                        <span>Start Your First Test</span>
                    </button>
                </div>
            </div>
        </div>
    {:else if filteredTests.length === 0}
        <div class="card shadow-sm border-0 text-center py-5 my-4">
            <div class="card-body">
                <i class="bi bi-search display-3 text-muted mb-3 d-block"></i>
                <h3 class="h5 fw-bold mb-2">No Matching Test Results</h3>
                <p class="text-muted mb-3">
                    No recent test matched your current search and filter settings.
                </p>
                <button class="btn btn-outline-primary" onclick={clearFilters}>
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Clear Filters
                </button>
            </div>
        </div>
    {:else if viewMode === "cards"}
        <!-- Detailed Cards Grid -->
        <div class="row g-3 mb-4">
            {#each filteredTests as test, i (getTestId(test, i))}
                <div class="col-12 col-md-6 col-xl-4">
                    <div
                        class="card h-100 shadow-sm border-0 hover-lift transition-all test-card"
                    >
                        <div class="card-body p-3 p-md-4 d-flex flex-column">
                            <!-- Card Header: Grade + Score + Source Badge -->
                            <div
                                class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom"
                            >
                                <div class="d-flex align-items-center gap-2">
                                    <GradeDisplay grade={test.grade} size="small" />
                                    <div class="lh-1">
                                        <div class="d-flex align-items-baseline gap-1">
                                            <strong
                                                class="fs-5 {getScoreColorClass(test.score || 0)}"
                                            >
                                                {test.score || 0}%
                                            </strong>
                                            <span class="text-muted small">score</span>
                                        </div>
                                        <small class="text-muted" style="font-size: 0.72rem;">
                                            Grade {test.grade}
                                        </small>
                                    </div>
                                </div>

                                <div class="d-flex align-items-center gap-1">
                                    {#if test.source === "uploaded"}
                                        <span
                                            class="badge bg-secondary bg-opacity-10 text-secondary d-flex align-items-center gap-1"
                                            title="Uploaded via .eml file"
                                        >
                                            <i class="bi bi-file-earmark-arrow-up"></i>
                                            Uploaded
                                        </span>
                                    {:else}
                                        <span
                                            class="badge bg-primary bg-opacity-10 text-primary d-flex align-items-center gap-1"
                                            title="Received via SMTP"
                                        >
                                            <i class="bi bi-envelope"></i>
                                            Received
                                        </span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Score Progress Bar -->
                            <div class="progress mb-3" style="height: 5px;">
                                <div
                                    class="progress-bar {getScoreProgressClass(test.score || 0)}"
                                    role="progressbar"
                                    style="width: {test.score || 0}%;"
                                    aria-valuenow={test.score || 0}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>

                            <!-- Domain and Sender -->
                            <div class="mb-2">
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <span
                                        class="badge bg-dark bg-opacity-10 text-body font-monospace px-2 py-1"
                                    >
                                        <i class="bi bi-globe me-1 text-primary"></i>
                                        {test.from_domain || "Unknown Domain"}
                                    </span>
                                </div>
                                <div
                                    class="text-truncate text-muted small"
                                    title={test.from || test.from_domain || ""}
                                >
                                    <i class="bi bi-person me-1"></i>
                                    {test.from || `sender@${test.from_domain || "domain.com"}`}
                                </div>
                            </div>

                            <!-- Subject Line -->
                            <div class="mb-3 flex-grow-1">
                                <div
                                    class="fw-semibold text-truncate mb-1"
                                    title={test.subject || "Deliverability Test Email"}
                                >
                                    <i class="bi bi-envelope-paper me-1 text-muted"></i>
                                    {test.subject || "Deliverability Test Email"}
                                </div>
                                <small class="text-muted" style="font-size: 0.75rem;">
                                    ID: <code class="text-muted">{getTestId(test, i)}</code>
                                </small>
                            </div>

                            <!-- Authentication Status Badges -->
                            <div class="d-flex flex-wrap gap-1 mb-3 pt-2 border-top">
                                <!-- SPF Status -->
                                <span
                                    class="badge {test.spf_status === 'pass'
                                        ? 'bg-success bg-opacity-15 text-success'
                                        : 'bg-danger bg-opacity-15 text-danger'} px-2 py-1"
                                    title="SPF Status: {test.spf_status || 'pass'}"
                                >
                                    <i
                                        class="bi {test.spf_status === 'pass'
                                            ? 'bi-check-circle-fill'
                                            : 'bi-x-circle-fill'} me-1"
                                    ></i>
                                    SPF {test.spf_status === "pass" ? "Pass" : "Fail"}
                                </span>

                                <!-- DKIM Status -->
                                <span
                                    class="badge {test.dkim_status === 'pass'
                                        ? 'bg-success bg-opacity-15 text-success'
                                        : 'bg-danger bg-opacity-15 text-danger'} px-2 py-1"
                                    title="DKIM Status: {test.dkim_status || 'pass'}"
                                >
                                    <i
                                        class="bi {test.dkim_status === 'pass'
                                            ? 'bi-check-circle-fill'
                                            : 'bi-x-circle-fill'} me-1"
                                    ></i>
                                    DKIM {test.dkim_status === "pass" ? "Pass" : "Fail"}
                                </span>

                                <!-- DMARC Status -->
                                <span
                                    class="badge {test.dmarc_status === 'pass'
                                        ? 'bg-success bg-opacity-15 text-success'
                                        : test.dmarc_status === 'neutral'
                                          ? 'bg-warning bg-opacity-15 text-dark'
                                          : 'bg-danger bg-opacity-15 text-danger'} px-2 py-1"
                                    title="DMARC Status: {test.dmarc_status || 'pass'}"
                                >
                                    <i
                                        class="bi {test.dmarc_status === 'pass'
                                            ? 'bi-check-circle-fill'
                                            : test.dmarc_status === 'neutral'
                                              ? 'bi-dash-circle-fill'
                                              : 'bi-x-circle-fill'} me-1"
                                    ></i>
                                    DMARC {test.dmarc_status === "pass"
                                        ? "Pass"
                                        : test.dmarc_status === "neutral"
                                          ? "Neutral"
                                          : "Fail"}
                                </span>
                            </div>

                            <!-- Footer: Timestamp & Action Link -->
                            <div
                                class="d-flex justify-content-between align-items-center pt-2 border-top mt-auto"
                            >
                                <span
                                    class="text-muted small"
                                    title={formatExactDate(test.created_at)}
                                >
                                    <i class="bi bi-clock me-1"></i>
                                    {formatRelativeDate(test.created_at)}
                                </span>
                                <a
                                    href={resolve("/test/[test]", { test: getTestId(test, i) })}
                                    class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 px-3"
                                >
                                    <span>View Report</span>
                                    <i class="bi bi-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <!-- Compact Table View -->
        <div class="card shadow-sm border-0 mb-4 overflow-hidden">
            <div class="table-responsive mb-0">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-4">Grade & Score</th>
                            <th>Sender Domain</th>
                            <th>Subject</th>
                            <th>Authentication</th>
                            <th>Source</th>
                            <th>Date</th>
                            <th class="text-end pe-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredTests as test, i (getTestId(test, i))}
                            <tr
                                class="cursor-pointer"
                                onclick={() =>
                                    goto(
                                        resolve("/test/[test]", { test: getTestId(test, i) }),
                                    )}
                            >
                                <td class="ps-4">
                                    <div class="d-flex align-items-center gap-2">
                                        <GradeDisplay grade={test.grade} size="small" />
                                        <div>
                                            <strong
                                                class="d-block {getScoreColorClass(
                                                    test.score || 0,
                                                )}"
                                            >
                                                {test.score || 0}%
                                            </strong>
                                            <div
                                                class="progress"
                                                style="width: 50px; height: 3px;"
                                            >
                                                <div
                                                    class="progress-bar {getScoreProgressClass(
                                                        test.score || 0,
                                                    )}"
                                                    role="progressbar"
                                                    style="width: {test.score || 0}%;"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="fw-semibold text-body font-monospace">
                                        {test.from_domain || "Unknown"}
                                    </span>
                                    <div class="text-muted small text-truncate" style="max-width: 180px;">
                                        {test.from || ""}
                                    </div>
                                </td>
                                <td>
                                    <div class="fw-medium text-truncate" style="max-width: 260px;">
                                        {test.subject || "Deliverability Test"}
                                    </div>
                                    <small class="text-muted font-monospace" style="font-size: 0.7rem;">
                                        {getTestId(test, i)}
                                    </small>
                                </td>
                                <td>
                                    <div class="d-flex gap-1">
                                        <span
                                            class="badge {test.spf_status === 'pass'
                                                ? 'bg-success'
                                                : 'bg-danger'} bg-opacity-10 text-{test.spf_status ===
                                            'pass'
                                                ? 'success'
                                                : 'danger'} px-1"
                                        >
                                            SPF
                                        </span>
                                        <span
                                            class="badge {test.dkim_status === 'pass'
                                                ? 'bg-success'
                                                : 'bg-danger'} bg-opacity-10 text-{test.dkim_status ===
                                            'pass'
                                                ? 'success'
                                                : 'danger'} px-1"
                                        >
                                            DKIM
                                        </span>
                                        <span
                                            class="badge {test.dmarc_status === 'pass'
                                                ? 'bg-success'
                                                : 'bg-warning'} bg-opacity-10 text-{test.dmarc_status ===
                                            'pass'
                                                ? 'success'
                                                : 'dark'} px-1"
                                        >
                                            DMARC
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    {#if test.source === "uploaded"}
                                        <span class="badge bg-secondary bg-opacity-10 text-secondary">
                                            Uploaded
                                        </span>
                                    {:else}
                                        <span class="badge bg-primary bg-opacity-10 text-primary">
                                            Received
                                        </span>
                                    {/if}
                                </td>
                                <td>
                                    <span class="small text-muted" title={formatExactDate(test.created_at)}>
                                        {formatRelativeDate(test.created_at)}
                                    </span>
                                </td>
                                <td class="text-end pe-4">
                                    <a
                                        href={resolve("/test/[test]", { test: getTestId(test, i) })}
                                        class="btn btn-sm btn-outline-primary"
                                        onclick={(e) => e.stopPropagation()}
                                    >
                                        View Report
                                    </a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}

    <!-- Quick Navigation to Specialized Testing Tools -->
    <div class="card shadow-sm border-0 mt-4 bg-body-tertiary">
        <div class="card-body p-3 p-md-4">
            <h2 class="h6 fw-bold text-uppercase text-muted tracking-wider mb-3">
                <i class="bi bi-tools me-1 text-primary"></i> Specialized Deliverability Diagnostics
            </h2>
            <div class="row g-3">
                <div class="col-12 col-md-4">
                    <a
                        href={resolve("/domain")}
                        class="d-flex align-items-center gap-3 p-3 rounded bg-body text-decoration-none border hover-lift transition-all"
                    >
                        <div class="p-2 rounded bg-primary bg-opacity-10 text-primary fs-4">
                            <i class="bi bi-globe"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-body">Domain DNS Inspector</div>
                            <small class="text-muted">Test MX, SPF, DKIM, DMARC & PTR records</small>
                        </div>
                    </a>
                </div>

                <div class="col-12 col-md-4">
                    <a
                        href={resolve("/bimi")}
                        class="d-flex align-items-center gap-3 p-3 rounded bg-body text-decoration-none border hover-lift transition-all"
                    >
                        <div class="p-2 rounded bg-info bg-opacity-10 text-info fs-4">
                            <i class="bi bi-award"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-body">BIMI Logo Validator</div>
                            <small class="text-muted">Validate SVG profile and VMC certificate</small>
                        </div>
                    </a>
                </div>

                <div class="col-12 col-md-4">
                    <a
                        href={resolve("/blacklist")}
                        class="d-flex align-items-center gap-3 p-3 rounded bg-body text-decoration-none border hover-lift transition-all"
                    >
                        <div class="p-2 rounded bg-danger bg-opacity-10 text-danger fs-4">
                            <i class="bi bi-shield-slash"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-body">IP Blacklist Checker</div>
                            <small class="text-muted">Query 50+ DNSBL and RBL reputation lists</small>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .hover-lift {
        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
    }

    .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
    }

    .cursor-pointer {
        cursor: pointer;
    }

    .btn-close-xs {
        width: 0.5rem;
        height: 0.5rem;
    }
</style>
