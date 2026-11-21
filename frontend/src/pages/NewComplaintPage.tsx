import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { VoiceRecorderModal } from '../components/VoiceRecorderModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Alert } from '../components/ui/Alert';
import {
  Mic,
  Camera,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldAlert,
  Clock,
  X
} from 'lucide-react';

const HYDERABAD_AREAS = [
  { area: 'Banjara Hills', lat: 17.4156, lng: 78.4347, circle: 'Circle 18 - Jubilee Hills' },
  { area: 'Jubilee Hills', lat: 17.4328, lng: 78.4071, circle: 'Circle 18 - Jubilee Hills' },
  { area: 'Madhapur', lat: 17.4504, lng: 78.3900, circle: 'Circle 20 - Serilingampally' },
  { area: 'Hitech City', lat: 17.4486, lng: 78.3806, circle: 'Circle 20 - Serilingampally' },
  { area: 'Kukatpally', lat: 17.4849, lng: 78.4138, circle: 'Circle 24 - Kukatpally' },
  { area: 'Secunderabad', lat: 17.4399, lng: 78.4983, circle: 'Circle 30 - Begumpet' },
  { area: 'Charminar', lat: 17.3616, lng: 78.4747, circle: 'Circle 9 - Charminar' },
  { area: 'Begumpet', lat: 17.4418, lng: 78.4636, circle: 'Circle 30 - Begumpet' },
  { area: 'Ameerpet', lat: 17.4374, lng: 78.4487, circle: 'Circle 19 - Ameerpet' },
  { area: 'LB Nagar', lat: 17.3463, lng: 78.5522, circle: 'Circle 3 - LB Nagar' },
];

export const NewComplaintPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [area, setArea] = useState(HYDERABAD_AREAS[0].area);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(HYDERABAD_AREAS[0].lat.toString());
  const [longitude, setLongitude] = useState(HYDERABAD_AREAS[0].lng.toString());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Modals & Async States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultNotice, setResultNotice] = useState<any>(null);

  const selectedAreaObj = HYDERABAD_AREAS.find((a) => a.area === area) || HYDERABAD_AREAS[0];

  const handleAreaChange = (selectedAreaName: string) => {
    setArea(selectedAreaName);
    const match = HYDERABAD_AREAS.find((a) => a.area === selectedAreaName);
    if (match) {
      setLatitude(match.lat.toString());
      setLongitude(match.lng.toString());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit', 'warning');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleVoiceTranscribed = (text: string, blob: Blob) => {
    setAudioBlob(blob);
    if (text) {
      setDescription((prev) => (prev ? `${prev}\n\n[Voice Transcript]: ${text}` : text));
      showToast('Voice transcript attached to description', 'success');
    } else {
      showToast('Voice recording attached to grievance submission', 'info');
    }
  };

  const canProceedStep1 = address.trim().length >= 5;
  const canProceedStep2 = title.trim().length >= 8 && description.trim().length >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in to lodge an official grievance', 'warning');
      navigate('/login');
      return;
    }

    if (!title || !description || !address) {
      showToast('Please complete all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    setResultNotice(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('area', area);
      formData.append('address', address.trim());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      const response = await complaintsApi.submitComplaint(formData);
      showToast('Grievance logged successfully with automated AI triage', 'success');

      if (response.duplicateNotice) {
        setResultNotice(response.duplicateNotice);
      } else {
        navigate(`/citizen/complaints/${response.complaint._id}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit grievance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'Submit Grievance' },
        ]}
      />

      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
          Lodge Civic Grievance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          GHMC Municipal Grievance Redressal System • Standard Operating Procedure Form
        </p>
      </div>

      {/* Prototype Notice */}
      <Alert
        variant="info"
        title="Prototype Evaluation Notice"
      >
        This is a hackathon simulation prototype for the Greater Hyderabad region. In accordance with open data privacy rules, grievances registered here do not trigger live municipal dispatch.
      </Alert>

      {/* Duplicate Notice Alert if triggered */}
      {resultNotice && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Nearby Duplicate Grievance Detected (500m Geospatial Radius)</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-800">
            {resultNotice.message}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/citizen/dashboard')}
            >
              View My Dashboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/explore')}
            >
              Explore Public Registry
            </Button>
          </div>
        </div>
      )}

      {/* Multi-step progress bar */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
            currentStep === 1
              ? 'border-civic-700 bg-civic-50 text-civic-900'
              : currentStep > 1
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-white border border-current shrink-0">
            {currentStep > 1 ? '✓' : '1'}
          </span>
          <span className="truncate">1. Locality & Spatial Geo</span>
        </div>

        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
            currentStep === 2
              ? 'border-civic-700 bg-civic-50 text-civic-900'
              : currentStep > 2
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-white border border-current shrink-0">
            {currentStep > 2 ? '✓' : '2'}
          </span>
          <span className="truncate">2. Grievance Narrative</span>
        </div>

        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
            currentStep === 3
              ? 'border-civic-700 bg-civic-50 text-civic-900'
              : 'border-slate-200 bg-white text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-white border border-current shrink-0">
            3
          </span>
          <span className="truncate">3. Evidence & Submit</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Locality & Spatial Geo */}
        {currentStep === 1 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Step 1: Locality & Spatial Coordinates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify the GHMC administrative zone and landmark for precise municipal dispatch.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GHMC Administrative Locality <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={area}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-700"
                  >
                    {HYDERABAD_AREAS.map((item) => (
                      <option key={item.area} value={item.area}>
                        {item.area} ({item.circle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Specific Street, Pillar or Landmark *"
                    placeholder="e.g., Road No. 36, Opposite Metro Pillar 1144"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    helperText="Include nearby commercial landmarks, ward number, or pole IDs"
                    required
                  />
                </div>
              </div>

              {/* Coordinates display */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-civic-700 shrink-0" />
                  <span>
                    Indexed Geolocation:{' '}
                    <strong className="font-mono text-slate-900">
                      [{Number(longitude).toFixed(4)}° E, {Number(latitude).toFixed(4)}° N]
                    </strong>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  MongoDB 2dsphere GeoJSON Point
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!canProceedStep1}
                  onClick={() => setCurrentStep(2)}
                >
                  <span>Proceed to Grievance Narrative</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: Grievance Details & Voice Note */}
        {currentStep === 2 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Step 2: Grievance Title & Detailed Description
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Describe the civic defect clearly. Multilingual voice input (English, Telugu, Hindi) is supported.
                </p>
              </div>

              <div>
                <Input
                  label="Grievance Title / Short Subject *"
                  placeholder="e.g., Open manhole with overflowing drainage water opposite primary school"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  helperText="Be specific about the physical defect and exact location"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Detailed Narrative & Public Hazard *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded border border-teal-200 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Dictation (EN / TE / HI)</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide comprehensive details: estimated dimensions of defect, pedestrian risk, water stagnation, duration of issue, or traffic disruption..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-civic-700 leading-relaxed font-sans"
                />

                {audioBlob && (
                  <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Voice audio recording successfully captured and attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setAudioBlob(null)}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Automated AI Intake notice */}
              <div className="p-3 bg-civic-50 rounded-md border border-civic-200 text-xs text-civic-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-civic-900">
                  <Sparkles className="w-3.5 h-3.5 text-civic-700" />
                  <span>Automated AI Triage Pipeline</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Upon submission, the intake pipeline computes category classification, department routing, and a 4-factor severity score (Safety Risk, Population, Duration, Evidence Strength).
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back to Location</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!canProceedStep2}
                  onClick={() => setCurrentStep(3)}
                >
                  <span>Proceed to Evidence & Submit</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Photographic Evidence & Submission */}
        {currentStep === 3 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Step 3: Photographic Evidence & Review
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Photographic verification provides proof for municipal crews and increases the triage evidence confidence factor.
                </p>
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Defect Photograph (JPG, PNG, WEBP - Max 5MB)
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 hover:border-civic-700 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>Select Photo from Device</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {previewUrl && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img
                        src={previewUrl}
                        alt="Evidence preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload an on-site photo showing the full context of the civic hazard.
                </p>
              </div>

              {/* Review Summary Box */}
              <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
                  Submission Summary
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Locality:</span>{' '}
                    <strong className="text-slate-800">{area}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Address:</span>{' '}
                    <strong className="text-slate-800">{address}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Title:</span>{' '}
                    <strong className="text-slate-800">{title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Photo Attached:</span>{' '}
                    <strong className="text-slate-800">{selectedFile ? 'Yes' : 'No'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Voice Note Attached:</span>{' '}
                    <strong className="text-slate-800">{audioBlob ? 'Yes' : 'No'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back to Narrative</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={submitting}
                >
                  <span>Submit Official Grievance</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </form>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscribed={handleVoiceTranscribed}
      />
    </div>
  );
};
