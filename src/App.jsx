import { useEffect, useMemo, useRef, useState } from "react";

const MODELS = [
  {
    id: "model-sara",
    name: "Sara",
    folder: "Sara",
    photos: [
      "photo_2026-01-31_16-40-45.jpg",
      "photo_2026-01-31_16-40-49.jpg",
      "photo_2026-01-31_16-40-52.jpg",
      "photo_2026-01-31_16-40-56.jpg",
      "photo_2026-01-31_16-41-01.jpg",
      "photo_2026-01-31_16-41-06.jpg",
      "photo_2026-01-31_16-41-10.jpg",
      "photo_2026-01-31_16-41-14.jpg",
      "photo_2026-01-31_16-41-17.jpg",
      "photo_2026-01-31_16-42-47.jpg",
      "photo_2026-01-31_16-42-50.jpg",
      "photo_2026-01-31_16-42-54.jpg",
      "photo_2026-01-31_17-04-30.jpg",
    ],
  },
  {
    id: "model-chloe",
    name: "Chloe",
    folder: "Chloe",
    photos: [
      "photo_2026-01-31_17-06-41.jpg",
      "photo_2026-01-31_17-06-48.jpg",
      "photo_2026-01-31_17-06-51.jpg",
      "photo_2026-01-31_17-06-53.jpg",
      "photo_2026-01-31_17-06-55.jpg",
      "photo_2026-01-31_17-06-58.jpg",
      "photo_2026-01-31_17-07-01.jpg",
      "photo_2026-01-31_17-07-03.jpg",
      "photo_2026-01-31_17-07-05.jpg",
      "photo_2026-01-31_17-07-08.jpg",
    ],
  },
  {
    id: "model-hailey",
    name: "Hailey",
    folder: "Hailey",
    photos: [
      "photo_2026-01-31_17-08-48.jpg",
      "photo_2026-01-31_17-08-57.jpg",
      "photo_2026-01-31_17-09-00.jpg",
      "photo_2026-01-31_17-09-02.jpg",
      "photo_2026-01-31_17-09-04.jpg",
      "photo_2026-01-31_17-09-07.jpg",
      "photo_2026-01-31_17-09-10.jpg",
      "photo_2026-01-31_17-09-12.jpg",
      "photo_2026-01-31_17-09-14.jpg",
      "photo_2026-01-31_17-09-15.jpg",
    ],
  },
];

const JOB_STEP_DEFS = [
  {
    label: "generating proxy",
    log: (location) => `Generating proxy for ${location}`,
  },
  { label: "proxy assigned", log: () => "Proxy assigned" },
  { label: "generating email", log: () => "Generating email" },
  { label: "requesting phone number", log: () => "Phone number received" },
  { label: "starting script", log: () => "Script started" },
  { label: "opening app", log: () => "Opening app" },
  { label: "creating account", log: () => "Account creation started" },
];

const PROXY_STEP_LABEL = "generating proxy";

const JOB_TICK_MS = 1400;
const DISPLAY_PHOTO_COUNT = 4;

const DEFAULT_DEVICES = [
  { id: "device-201", status: "online", currentJob: "idle" },
  { id: "device-114", status: "offline", currentJob: "idle" },
  { id: "device-305", status: "online", currentJob: "job-1024" },
];

const DEFAULT_PROFILE = {
  job: "Content Creator",
  university: "UT Dallas",
  dob: "2001-04-16",
  dobRangeMin: "1997-01-01",
  dobRangeMax: "2004-12-31",
  snapchat: "snap.ava",
  state: "Texas",
  city: "Dallas",
  deviceId: "device-201",
};

function getPhotoUrl(folder, filename) {
  return `/models/${folder}/${filename}`;
}

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatStepLabel(label) {
  return label
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function randomDateInRange(minDate, maxDate) {
  const min = new Date(minDate).getTime();
  const max = new Date(maxDate).getTime();
  if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
    return minDate;
  }
  const randomTime = min + Math.random() * (max - min);
  return new Date(randomTime).toISOString().slice(0, 10);
}

function buildJobSteps() {
  return JOB_STEP_DEFS.map((step) => ({
    label: step.label,
    status: "pending",
  }));
}

function StatusBadge({ status }) {
  const label = status?.replace("-", " ") ?? "unknown";
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

export default function App() {
  const [devices, setDevices] = useState(DEFAULT_DEVICES);
  const [newDevice, setNewDevice] = useState({
    id: "",
    status: "online",
    currentJob: "idle",
  });
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const [modelPhotos, setModelPhotos] = useState(
    MODELS[0].photos.slice(0, DISPLAY_PHOTO_COUNT)
  );
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [activeStepLabel, setActiveStepLabel] = useState(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const timeoutsRef = useRef({});

  const selectedModel = useMemo(
    () => MODELS.find((model) => model.id === selectedModelId),
    [selectedModelId]
  );

  const onlineCount = devices.filter((device) => device.status === "online")
    .length;

  useEffect(() => {
    if (!selectedModel) return;
    setModelPhotos(selectedModel.photos.slice(0, DISPLAY_PHOTO_COUNT));
  }, [selectedModel]);

  useEffect(() => {
    setProfile((prev) => {
      if (devices.length === 0) {
        return { ...prev, deviceId: "" };
      }
      const hasDevice = devices.some((device) => device.id === prev.deviceId);
      if (hasDevice) return prev;
      return { ...prev, deviceId: devices[0].id };
    });
  }, [devices]);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeoutId) =>
        clearTimeout(timeoutId)
      );
    };
  }, []);

  const handleDeviceChange = (index, field, value) => {
    setDevices((prev) =>
      prev.map((device, idx) =>
        idx === index ? { ...device, [field]: value } : device
      )
    );
  };

  const handleAddDevice = () => {
    if (!newDevice.id.trim()) return;
    setDevices((prev) => [...prev, { ...newDevice, id: newDevice.id.trim() }]);
    setNewDevice({ id: "", status: "online", currentJob: "idle" });
  };

  const handleRemoveDevice = (index) => {
    setDevices((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRandomizeDob = () => {
    setProfile((prev) => ({
      ...prev,
      dob: randomDateInRange(prev.dobRangeMin, prev.dobRangeMax),
    }));
  };

  const handlePhotoReplace = (index) => {
    if (!selectedModel) return;
    const available = selectedModel.photos.filter(
      (photo) => !modelPhotos.includes(photo)
    );
    if (available.length === 0) return;
    const replacement = available[Math.floor(Math.random() * available.length)];
    setModelPhotos((prev) =>
      prev.map((photo, idx) => (idx === index ? replacement : photo))
    );
  };

  const startJobSimulation = (jobId, location, startIndex = 0) => {
    const runStep = (index) => {
      let shouldContinue = false;
      setJobs((prev) =>
        prev.map((job) => {
          if (job.id !== jobId) return job;
          if (job.playback !== "play") return job;
          if (index >= JOB_STEP_DEFS.length) {
            return {
              ...job,
              status: "done",
              playback: "stop",
              progressIndex: index,
              steps: job.steps.map((step) => ({ ...step, status: "done" })),
              logs: [
                ...job.logs,
                {
                  message: "Job complete",
                  stepLabel: "system",
                  timestamp: new Date(),
                },
              ],
            };
          }
          const updatedSteps = job.steps.map((step, stepIndex) => {
            if (stepIndex < index) {
              return { ...step, status: "done" };
            }
            if (stepIndex === index) {
              return { ...step, status: "in-progress" };
            }
            return { ...step, status: "pending" };
          });
          const logLine = JOB_STEP_DEFS[index].log(location);
          const logEntry = {
            message: logLine,
            stepLabel: JOB_STEP_DEFS[index].label,
            timestamp: new Date(),
          };
          shouldContinue = true;
          return {
            ...job,
            status: "in-progress",
            playback: "play",
            progressIndex: index,
            steps: updatedSteps,
            logs: [...job.logs, logEntry],
          };
        })
      );
      if (shouldContinue && index < JOB_STEP_DEFS.length) {
        const timeoutId = setTimeout(() => runStep(index + 1), JOB_TICK_MS);
        timeoutsRef.current[jobId] = timeoutId;
      }
    };
    runStep(startIndex);
  };

  const handleStartJob = () => {
    if (!selectedModel) return;
    const location = `${profile.city}, ${profile.state}`;
    const jobId = `job-${Date.now()}`;
    const createdAt = new Date();
    const newJob = {
      id: jobId,
      model: selectedModel.name,
      status: "in-progress",
      playback: "play",
      progressIndex: -1,
      createdAt,
      steps: buildJobSteps(),
      logs: [
        {
          message: `Job created at ${formatTimestamp(createdAt)}`,
          stepLabel: "system",
          timestamp: createdAt,
        },
      ],
      snapshot: {
        ...profile,
      },
    };

    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(jobId);
    startJobSimulation(jobId, location);
  };

  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const currentStep =
    selectedJob?.steps.find((step) => step.status === "in-progress") ??
    selectedJob?.steps[selectedJob.steps.length - 1];
  const selectedStep =
    selectedJob?.steps.find((step) => step.label === activeStepLabel) ??
    currentStep;

  const handleStepLogsOpen = (label) => {
    if (!label) return;
    setActiveStepLabel(label);
    setIsLogsOpen(true);
  };

  const closeJobModal = () => {
    setIsJobModalOpen(false);
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobId(jobId);
    setIsLogsOpen(false);
    setActiveStepLabel(null);
    setIsJobModalOpen(true);
  };

  const handlePlayback = (jobId, action) => {
    if (action === "stop") {
      clearTimeout(timeoutsRef.current[jobId]);
    }

    let jobToResume = null;
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        if (action === "stop") {
          return {
            ...job,
            playback: "stop",
            status: "pending",
            progressIndex: -1,
            steps: buildJobSteps(),
            logs: [
              ...job.logs,
              {
                message: "Job stopped",
                stepLabel: "system",
                timestamp: new Date(),
              },
            ],
          };
        }

        if (action === "play") {
          jobToResume = job;
          const shouldRestart =
            job.playback === "stop" || (job.progressIndex ?? -1) === -1;
          return shouldRestart
            ? {
                ...job,
                playback: action,
                logs: [
                  ...job.logs,
                  {
                    message: "Job restarted",
                    stepLabel: "system",
                    timestamp: new Date(),
                  },
                ],
              }
            : { ...job, playback: action };
        }

        return { ...job, playback: action };
      })
    );

    if (action === "play" && jobToResume) {
      const nextIndex =
        jobToResume.progressIndex === -1 ||
        jobToResume.playback === "stop"
          ? 0
          : (jobToResume.progressIndex ?? -1) + 1;
      const location = `${jobToResume.snapshot.city}, ${jobToResume.snapshot.state}`;
      startJobSimulation(jobToResume.id, location, nextIndex);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-overline">Web Platform</p>
          <h1>Appium Job Control</h1>

        </div>
        <div className="header-stats">
          <div>
            <p className="stat-label">Devices online</p>
            <p className="stat-value">
              {onlineCount} / {devices.length}
            </p>
          </div>
          <div>
            <p className="stat-label">Active jobs</p>
            <p className="stat-value">
              {jobs.filter((job) => job.status === "in-progress").length}
            </p>
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <div className="card-header">
            <h2>Devices</h2>
            <p>Manage devices and check their status.</p>
          </div>

          <div className="device-form">
            <input
              type="text"
              placeholder="Device ID"
              value={newDevice.id}
              onChange={(event) =>
                setNewDevice((prev) => ({ ...prev, id: event.target.value }))
              }
            />
            <button className="primary" onClick={handleAddDevice}>
              Add device
            </button>
          </div>

          <div className="table">
            <div className="table-row table-head">
              <span>Device ID</span>
              <span>Status</span>
              <span>Current job</span>
              <span></span>
            </div>
            {devices.map((device, index) => (
              <div className="table-row" key={device.id}>
                <span className="mono">{device.id}</span>
                <select
                  value={device.status}
                  onChange={(event) =>
                    handleDeviceChange(index, "status", event.target.value)
                  }
                >
                  <option value="online">online</option>
                  <option value="offline">offline</option>
                </select>
                <input
                  type="text"
                  value={device.currentJob}
                  onChange={(event) =>
                    handleDeviceChange(index, "currentJob", event.target.value)
                  }
                />
                <button
                  className="ghost"
                  onClick={() => handleRemoveDevice(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Create account job</h2>
            <p>Configure the profile and launch a new job.</p>
          </div>

          <div className="form-grid">
            <label>
              Model
              <select
                value={selectedModelId}
                onChange={(event) => setSelectedModelId(event.target.value)}
              >
                {MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Job
              <input
                type="text"
                value={profile.job}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, job: event.target.value }))
                }
              />
            </label>

            <label>
              University
              <input
                type="text"
                value={profile.university}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    university: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Snapchat username
              <input
                type="text"
                value={profile.snapchat}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    snapchat: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Date of birth
              <input
                type="date"
                value={profile.dob}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, dob: event.target.value }))
                }
              />
            </label>

            <label>
              DOB range (min)
              <input
                type="date"
                value={profile.dobRangeMin}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    dobRangeMin: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              DOB range (max)
              <input
                type="date"
                value={profile.dobRangeMax}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    dobRangeMax: event.target.value,
                  }))
                }
              />
            </label>

            <div className="form-inline">
              <button className="ghost" onClick={handleRandomizeDob}>
                Randomize DOB
              </button>
              <span className="helper">
                Range based on min and max dates.
              </span>
            </div>

            <label>
              State
              <input
                type="text"
                value={profile.state}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, state: event.target.value }))
                }
              />
            </label>

            <label>
              City
              <input
                type="text"
                value={profile.city}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, city: event.target.value }))
                }
              />
            </label>

            <label>
              Device
              <select
                value={profile.deviceId}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    deviceId: event.target.value,
                  }))
                }
              >
                {devices.length === 0 ? (
                  <option value="">No devices added</option>
                ) : (
                  devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.id} ({device.status})
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>

          <div className="photo-panel">
            <div className="photo-header">
              <h3>Model photos</h3>
              <p>Delete a photo to auto-generate a replacement.</p>
            </div>
            <div className="photo-grid">
              {modelPhotos.map((photo, index) => (
                <div className="photo-card" key={photo}>
                  <img
                    src={getPhotoUrl(selectedModel?.folder, photo)}
                    alt="Model"
                  />
                  <button
                    className="ghost"
                    onClick={() => handlePhotoReplace(index)}
                  >
                    Delete photo
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="primary full-width" onClick={handleStartJob}>
            Start job
          </button>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Job monitoring</h2>
            <p>Track job progress and live logs.</p>
          </div>

          <div className="job-layout">
            <div className="job-sidebar">
              <div className="job-list">
              {jobs.length === 0 && (
                <div className="empty-state">
                  No jobs yet. Start one to see progress.
                </div>
              )}
              {jobs.map((job) => (
                <button
                  key={job.id}
                  className={`job-row ${
                    selectedJobId === job.id ? "active" : ""
                  }`}
                  onClick={() => handleSelectJob(job.id)}
                >
                  <div>
                    <p className="job-title">{job.model}</p>
                    <p className="job-meta">
                      {job.snapshot.city}, {job.snapshot.state}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </button>
              ))}
              </div>

            </div>

            <div className="job-detail">
              {!selectedJob ? (
                <div className="empty-state">
                  Select a job to see details.
                </div>
              ) : (
                <div className="job-detail-placeholder">
                  Open a job to view live logs and controls.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {isJobModalOpen && selectedJob && (
        <div className="modal-backdrop" onClick={closeJobModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="meta-label">Job monitoring</p>
                <h3>{selectedJob.model}</h3>
                <p className="job-meta">
                  {selectedJob.snapshot.city}, {selectedJob.snapshot.state}
                </p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>
            <div className="modal-body">
                <div className="job-meta-grid">
                <div>
                  <p className="meta-label">Job</p>
                  <p className="meta-value">{selectedJob.snapshot.job}</p>
                </div>
                <div>
                  <p className="meta-label">University</p>
                  <p className="meta-value">
                    {selectedJob.snapshot.university}
                  </p>
                </div>
                <div>
                  <p className="meta-label">DOB</p>
                  <p className="meta-value">{selectedJob.snapshot.dob}</p>
                </div>
                <div>
                  <p className="meta-label">Snapchat</p>
                  <p className="meta-value">
                    {selectedJob.snapshot.snapchat}
                  </p>
                </div>
                <div>
                  <p className="meta-label">Device</p>
                  <p className="meta-value">
                    {selectedJob.snapshot.deviceId || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="modal-controls">
                <button
                  className="step-button"
                  onClick={() => handleStepLogsOpen(PROXY_STEP_LABEL)}
                >
                  Generate Proxy
                </button>
                <div className="control-buttons">
                  <button
                    className={`icon-button ${
                      selectedJob.playback === "play" ? "active" : ""
                    }`}
                    onClick={() => handlePlayback(selectedJob.id, "play")}
                    type="button"
                  >
                    Play
                  </button>
                  <button
                    className={`icon-button ${
                      selectedJob.playback === "pause" ? "active" : ""
                    }`}
                    onClick={() => handlePlayback(selectedJob.id, "pause")}
                    type="button"
                  >
                    Pause
                  </button>
                  <button
                    className={`icon-button ${
                      selectedJob.playback === "stop" ? "active" : ""
                    }`}
                    onClick={() => handlePlayback(selectedJob.id, "stop")}
                    type="button"
                  >
                    Stop
                  </button>
                </div>
              </div>

              {isLogsOpen ? (
                <div className="log-box">
                  {selectedJob.logs.length === 0 ? (
                    <p>No logs yet.</p>
                  ) : (
                    selectedJob.logs.map((log, index) => (
                      <p key={`${selectedJob.id}-modal-log-${index}`}>
                        [{formatTimestamp(new Date(log.timestamp))}]{" "}
                        {formatStepLabel(log.stepLabel || "system")} —{" "}
                        {log.message}
                      </p>
                    ))
                  )}
                </div>
              ) : (
                <div className="log-placeholder">
                  Click the step button to view logs.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="primary" onClick={closeJobModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
