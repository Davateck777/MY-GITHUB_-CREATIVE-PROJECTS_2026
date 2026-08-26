const state = { slots: [], appointments: [], email: '', selectedSlot: null };
const byId = (id) => document.getElementById(id);
const slotsList = byId('slots-list');
const appointmentsList = byId('appointments-list');
const bookingDialog = byId('booking-dialog');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}

function displayDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  }).format(parsed);
}

function displayTime(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    hour: 'numeric', minute: '2-digit'
  }).format(parsed);
}

function notice(message, type = 'error') {
  const element = byId('notice');
  element.textContent = message;
  element.className = `notice ${type === 'success' ? 'success' : ''}`;
  element.hidden = false;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => { element.hidden = true; }, 5000);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed with HTTP ${response.status}`);
  return payload;
}

async function loadSlots() {
  slotsList.innerHTML = '<div class="empty-state"><span>…</span><p>Loading slots…</p></div>';
  const params = new URLSearchParams();
  const date = byId('filter-date').value;
  const specialty = byId('filter-specialty').value;
  if (date) params.set('date', date);
  if (specialty) params.set('specialty', specialty);
  try {
    const payload = await api(`/api/slots?${params}`);
    state.slots = payload.slots || [];
    renderSlots();
  } catch (error) {
    slotsList.innerHTML = `<div class="empty-state"><span>!</span><p>${escapeHtml(error.message)}</p></div>`;
    notice(error.message);
  }
}

function renderSlots() {
  byId('slot-count').textContent = `${state.slots.length} ${state.slots.length === 1 ? 'slot' : 'slots'}`;
  if (!state.slots.length) {
    slotsList.innerHTML = '<div class="empty-state"><span>↗</span><p>No available slots match your filters.</p></div>';
    return;
  }
  slotsList.innerHTML = state.slots.map((slot) => `
    <div class="slot-row">
      <div><div class="slot-date">${escapeHtml(displayDate(slot.startsAt))}</div><span class="slot-time">${escapeHtml(displayTime(slot.startsAt))} · ${slot.durationMinutes} min</span></div>
      <div class="slot-provider">${escapeHtml(slot.providerName)}<span class="slot-specialty">${escapeHtml(slot.specialty)}</span></div>
      <button class="outline-btn" type="button" data-book-slot="${escapeHtml(slot.id)}">Book</button>
    </div>
  `).join('');
}

function openBooking(slotId) {
  const slot = state.slots.find((item) => item.id === slotId);
  if (!slot) return;
  state.selectedSlot = slot;
  byId('booking-slot').value = slot.id;
  byId('selected-slot').textContent = `${displayDate(slot.startsAt)} at ${displayTime(slot.startsAt)} · ${slot.providerName} · ${slot.specialty}`;
  byId('booking-email').value = state.email;
  bookingDialog.showModal();
}

async function loadAppointments(email = byId('patient-email').value.trim()) {
  if (!email) return;
  state.email = email;
  appointmentsList.innerHTML = '<div class="empty-state"><span>…</span><p>Loading appointments…</p></div>';
  try {
    const payload = await api(`/api/appointments?email=${encodeURIComponent(email)}`);
    state.appointments = payload.appointments || [];
    renderAppointments();
  } catch (error) {
    appointmentsList.innerHTML = `<div class="empty-state"><span>!</span><p>${escapeHtml(error.message)}</p></div>`;
    notice(error.message);
  }
}

function renderAppointments() {
  if (!state.appointments.length) {
    appointmentsList.innerHTML = '<div class="empty-state"><span>↗</span><p>No appointments found for this email.</p></div>';
    return;
  }
  appointmentsList.innerHTML = state.appointments.map((appointment) => {
    const cancelled = appointment.status === 'CANCELLED';
    return `
      <article class="appointment-card">
        <div class="appointment-top"><div><div class="appointment-date">${escapeHtml(displayDate(appointment.startsAt))}</div><div class="appointment-time">${escapeHtml(displayTime(appointment.startsAt))}</div></div><span class="status ${cancelled ? 'cancelled' : ''}">${escapeHtml(appointment.status)}</span></div>
        <div class="appointment-provider">${escapeHtml(appointment.providerName)}</div>
        <div class="appointment-meta">${escapeHtml(appointment.specialty)} · <span class="appointment-id">${escapeHtml(appointment.id)}</span></div>
        ${appointment.reason ? `<div class="appointment-meta">Reason: ${escapeHtml(appointment.reason)}</div>` : ''}
        ${cancelled ? '' : `<div class="appointment-actions"><button class="outline-btn" type="button" data-cancel-id="${escapeHtml(appointment.id)}">Cancel appointment</button></div>`}
      </article>
    `;
  }).join('');
}

slotsList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-book-slot]');
  if (button) openBooking(button.dataset.bookSlot);
});

appointmentsList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-cancel-id]');
  if (!button) return;
  const appointment = state.appointments.find((item) => item.id === button.dataset.cancelId);
  if (!appointment || !window.confirm(`Cancel appointment ${appointment.id}?`)) return;
  button.disabled = true;
  try {
    await api(`/api/appointments/${encodeURIComponent(appointment.id)}/cancel`, { method: 'POST', body: '{}' });
    notice('Appointment cancelled successfully. The slot is available again.', 'success');
    await loadSlots();
    await loadAppointments(state.email);
  } catch (error) {
    button.disabled = false;
    notice(error.message);
  }
});

byId('filter-form').addEventListener('submit', (event) => { event.preventDefault(); loadSlots(); });
byId('appointments-form').addEventListener('submit', (event) => { event.preventDefault(); loadAppointments(); });

byId('booking-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = event.submitter;
  submitButton.disabled = true;
  try {
    const payload = await api('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        slotId: byId('booking-slot').value,
        patientName: byId('patient-name').value,
        patientEmail: byId('booking-email').value,
        reason: byId('booking-reason').value
      })
    });
    const appointment = payload.appointment;
    bookingDialog.close();
    byId('patient-email').value = appointment.patientEmail;
    state.email = appointment.patientEmail;
    event.target.reset();
    notice(`Appointment booked. Confirmation ID: ${appointment.id}`, 'success');
    await loadSlots();
    await loadAppointments(state.email);
  } catch (error) {
    notice(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
byId('refresh-btn').addEventListener('click', async () => {
  await loadSlots();
  if (state.email) await loadAppointments(state.email);
  notice('Availability refreshed.', 'success');
});

loadSlots();
