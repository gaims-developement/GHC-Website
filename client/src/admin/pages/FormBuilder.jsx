import { ArrowDown, ArrowUp, Copy, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const fieldTypes = [
  ["short_text", "Text"],
  ["long_text", "Textarea"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["number", "Number"],
  ["date", "Date"],
  ["dropdown", "Dropdown"],
  ["radio", "Radio Buttons"],
  ["checkbox", "Checkboxes"],
  ["multi_select", "Multi Select"],
  ["file_upload", "File Upload"],
  ["image_upload", "Image Upload"],
  ["url", "URL"],
  ["rating", "Rating"],
  ["signature", "Signature"],
  ["section_break", "Section Break"],
  ["heading", "Heading"],
  ["paragraph", "Paragraph"],
  ["terms", "Terms & Conditions"],
];

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  category: "application",
  status: "draft",
  teamId: "",
  allowMultipleSubmissions: false,
  submissionLimit: "",
  startDate: "",
  endDate: "",
  autoClose: false,
  successMessage: "Thank you. Your response has been submitted.",
  redirectUrl: "",
  emailNotifications: false,
  notificationEmails: "",
  allowEditing: false,
  anonymousResponses: false,
  recaptchaEnabled: false,
  maxFileSizeMb: 10,
  allowedFileFormats: "jpg,jpeg,png,pdf,ppt,pptx,doc,docx,zip",
  embedEnabled: true,
};

const newField = (type = "short_text", index = 0) => ({
  fieldLabel: "Untitled field",
  fieldName: `field_${Date.now()}`,
  fieldType: type,
  required: false,
  placeholder: "",
  fieldOrder: index,
  helpText: "",
  validationRules: {},
  conditionalLogic: {},
  options: ["dropdown", "radio", "checkbox", "multi_select"].includes(type) ? [{ optionValue: "option_1", displayText: "Option 1" }] : [],
});

const toLocalInput = (value) => value ? String(value).slice(0, 16) : "";
const parseJsonInput = (value, fallback = {}) => {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return fallback;
  }
};

function FormBuilder({ api, activePage, onNavigate }) {
  const formId = useMemo(() => activePage?.match(/^form-(\d+)$/)?.[1], [activePage]);
  const isCreate = activePage === "forms-create";
  const [form, setForm] = useState(emptyForm);
  const [fields, setFields] = useState([]);
  const [metadata, setMetadata] = useState({ teams: [], templates: [] });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api.get("/api/forms/metadata").then((response) => setMetadata(response.data));
    if (formId) {
      api.get(`/api/forms/${formId}`).then((response) => {
        const item = response.data.form;
        setForm({
          ...emptyForm,
          title: item.title || "",
          slug: item.slug || "",
          description: item.description || "",
          category: item.category || "application",
          status: item.status || "draft",
          teamId: item.team_id || "",
          allowMultipleSubmissions: Boolean(item.allow_multiple_submissions),
          submissionLimit: item.submission_limit || "",
          startDate: toLocalInput(item.start_date),
          endDate: toLocalInput(item.end_date),
          autoClose: Boolean(item.auto_close),
          successMessage: item.success_message || emptyForm.successMessage,
          redirectUrl: item.redirect_url || "",
          emailNotifications: Boolean(item.email_notifications),
          notificationEmails: item.notification_emails || "",
          allowEditing: Boolean(item.allow_editing),
          anonymousResponses: Boolean(item.anonymous_responses),
          recaptchaEnabled: Boolean(item.recaptcha_enabled),
          maxFileSizeMb: item.max_file_size_mb || 10,
          allowedFileFormats: item.allowed_file_formats || emptyForm.allowedFileFormats,
          embedEnabled: item.embed_enabled !== false && item.embed_enabled !== 0,
        });
        setFields((item.fields || []).map((field) => ({
          fieldLabel: field.field_label,
          fieldName: field.field_name,
          fieldType: field.field_type,
          required: Boolean(field.required),
          placeholder: field.placeholder || "",
          fieldOrder: field.field_order || 0,
          helpText: field.help_text || "",
          validationRules: field.validation_rules || {},
          conditionalLogic: field.conditional_logic || {},
          options: (field.options || []).map((option) => ({ optionValue: option.option_value, displayText: option.display_text })),
        })));
      }).catch((requestError) => setError(requestError.response?.data?.message || "Unable to load form."));
    } else if (isCreate) {
      setForm(emptyForm);
      setFields([newField("short_text", 0), newField("email", 1)]);
    }
  }, [api, formId, isCreate]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const updateField = (index, patch) => {
    setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  };

  const moveField = (index, direction) => {
    setFields((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((field, fieldIndex) => ({ ...field, fieldOrder: fieldIndex }));
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = { ...form, fields };
      const response = formId ? await api.put(`/api/forms/${formId}`, payload) : await api.post("/api/forms", payload);
      setMessage("Form saved.");
      if (!formId) onNavigate(`form-${response.data.form.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save form.");
    }
  };

  return (
    <form className="admin-speakers-page ops-page" onSubmit={save}>
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Form Builder</p>
            <h1>{formId ? form.title || "Edit form" : "Create form"}</h1>
            <p className="admin-muted">Build fields, workflow settings, conditional logic and public publishing from one database-driven builder.</p>
          </div>
          <button className="admin-primary-button" type="submit"><Save size={18} /> Save form</button>
        </div>
        {message && <div className="admin-success">{message}</div>}
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="settings-form-grid">
        <div className="admin-panel settings-section">
          <h2>Form details</h2>
          <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
          <label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated if blank" /></label>
          <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="speaker-form-grid">
            <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="application">Application</option><option value="survey">Survey</option><option value="feedback">Feedback</option><option value="registration">Registration</option><option value="nomination">Nomination</option></select></label>
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
            <label>Team<select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })}><option value="">Global</option>{metadata.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          </div>
        </div>

        <div className="admin-panel settings-section">
          <h2>Settings</h2>
          <div className="speaker-form-grid">
            <label>Submission limit<input type="number" value={form.submissionLimit} onChange={(event) => setForm({ ...form, submissionLimit: event.target.value })} /></label>
            <label>Start date<input type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
            <label>End date<input type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
            <label>Max file size MB<input type="number" value={form.maxFileSizeMb} onChange={(event) => setForm({ ...form, maxFileSizeMb: event.target.value })} /></label>
          </div>
          <label>Allowed formats<input value={form.allowedFileFormats} onChange={(event) => setForm({ ...form, allowedFileFormats: event.target.value })} /></label>
          <label>Success message<input value={form.successMessage} onChange={(event) => setForm({ ...form, successMessage: event.target.value })} /></label>
          <label>Redirect URL<input value={form.redirectUrl} onChange={(event) => setForm({ ...form, redirectUrl: event.target.value })} /></label>
          <label>Notification emails<input value={form.notificationEmails} onChange={(event) => setForm({ ...form, notificationEmails: event.target.value })} /></label>
          <div className="settings-toggle-list">
            {[
              ["allowMultipleSubmissions", "Allow multiple responses"],
              ["autoClose", "Auto close"],
              ["emailNotifications", "Email notifications"],
              ["allowEditing", "Allow editing"],
              ["anonymousResponses", "Anonymous responses"],
              ["recaptchaEnabled", "reCAPTCHA"],
              ["embedEnabled", "Embed enabled"],
            ].map(([key, label]) => <label key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /> {label}</label>)}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">Builder</p><h2>Fields</h2></div>
          <div className="export-button-row">
            {fieldTypes.slice(0, 12).map(([type, label]) => <button key={type} className="admin-secondary-button" type="button" onClick={() => setFields((current) => [...current, newField(type, current.length)])}>{label}</button>)}
          </div>
        </div>
        <div className="super-role-grid">
          {fields.map((field, index) => (
            <article key={`${field.fieldName}-${index}`}>
              <div className="admin-panel-heading">
                <strong>{index + 1}. {field.fieldLabel}</strong>
                <div className="export-button-row">
                  <button type="button" className="admin-secondary-button" onClick={() => moveField(index, -1)}><ArrowUp size={15} /></button>
                  <button type="button" className="admin-secondary-button" onClick={() => moveField(index, 1)}><ArrowDown size={15} /></button>
                  <button type="button" className="admin-secondary-button" onClick={() => setFields((current) => [...current, { ...field, fieldName: `${field.fieldName}_copy_${Date.now()}` }])}><Copy size={15} /></button>
                  <button type="button" className="admin-secondary-button" onClick={() => setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))}><Trash2 size={15} /></button>
                </div>
              </div>
              <label>Label<input value={field.fieldLabel} onChange={(event) => updateField(index, { fieldLabel: event.target.value })} /></label>
              <label>Name<input value={field.fieldName} onChange={(event) => updateField(index, { fieldName: event.target.value })} /></label>
              <label>Type<select value={field.fieldType} onChange={(event) => updateField(index, { ...newField(event.target.value, index), fieldLabel: field.fieldLabel, fieldName: field.fieldName })}>{fieldTypes.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label>
              <label>Placeholder<input value={field.placeholder} onChange={(event) => updateField(index, { placeholder: event.target.value })} /></label>
              <label>Help text<input value={field.helpText} onChange={(event) => updateField(index, { helpText: event.target.value })} /></label>
              <label><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} /> Required</label>
              <label>Conditional logic JSON<textarea value={JSON.stringify(field.conditionalLogic || {})} onChange={(event) => updateField(index, { conditionalLogic: parseJsonInput(event.target.value, field.conditionalLogic || {}) })} /></label>
              {field.options?.length > 0 && (
                <div>
                  <strong>Options</strong>
                  {field.options.map((option, optionIndex) => (
                    <label key={optionIndex}>Option<input value={option.displayText} onChange={(event) => updateField(index, { options: field.options.map((item, itemIndex) => itemIndex === optionIndex ? { optionValue: event.target.value.toLowerCase().replace(/\s+/g, "_"), displayText: event.target.value } : item) })} /></label>
                  ))}
                  <button type="button" className="admin-secondary-button" onClick={() => updateField(index, { options: [...field.options, { optionValue: `option_${field.options.length + 1}`, displayText: `Option ${field.options.length + 1}` }] })}><Plus size={15} /> Add option</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </form>
  );
}

export default FormBuilder;
