import { User, Phone, UserPlus, MapPin, CreditCard, Calendar, UserCircle, Image, Pill, FileEdit, Mic, Printer, Stethoscope, Trash2, ChevronDown, ChevronRight, Droplet } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getPatient, addCompteRendu, addOrdonnance, deleteCompteRendu, deleteOrdonnance, uploadPatientPhoto } from '../api/client'
import { useCurrentPatient } from '../context/CurrentPatientContext'
import { config } from '../config/env.js'

const InfoField = ({ icon: Icon, label, value, placeholder = '—', className = '' }) => (
  <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-4 rounded-xl bg-darkGreen/[0.02] hover:bg-darkGreen/[0.04] transition-colors min-w-0 w-full text-center ${className}`}>
    <div className="w-10 h-10 rounded-xl bg-primaryGreen/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-darkGreen/50 uppercase tracking-wider">{label}</p>
      <p className="text-[15px] font-medium text-darkGreen mt-0.5 break-words">{value || placeholder}</p>
    </div>
  </div>
)

const DEFAULT_PATIENT_ID = 1 // fallback when no user context

const formatDate = () => {
  const d = new Date()
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const useVoiceInput = (onText) => {
  const [listening, setListening] = useState(false)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.")
      return
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      if (last.isFinal) onText(last[0].transcript + ' ')
    }
    recognition.start()
  }
  return { listening, startListening }
}

export default function HospitalDashboard() {
  const { currentUser } = useOutletContext() || {}
  const patientId = currentUser?.userId ?? DEFAULT_PATIENT_ID
  const { setCurrentPatient } = useCurrentPatient()
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [inputModeCr, setInputModeCr] = useState('manual')
  const [inputModeOrd, setInputModeOrd] = useState('manual')
  const [nouvelleOrdonnance, setNouvelleOrdonnance] = useState('')
  const [nouveauCompteRendu, setNouveauCompteRendu] = useState('')
  const [expandedCrIds, setExpandedCrIds] = useState(new Set())
  const [expandedOrdIds, setExpandedOrdIds] = useState(new Set())
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const photoInputRef = useRef(null)

  const toggleCr = (id) => {
    setExpandedCrIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleOrd = (id) => {
    setExpandedOrdIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    getPatient(patientId)
      .then((data) => {
        if (!cancelled) {
          setPatientData(data)
          setCurrentPatient(patientId, data?.patient?.nomComplet ?? null)
        }
      })
      .catch((e) => {
        if (!cancelled) setFetchError(e.message || 'Erreur chargement patient')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [patientId])

  const patient = patientData?.patient ?? null
  const antecedents = patientData?.antecedents ?? { personnels: '', familiaux: '' }
  const compteRendus = patientData?.compteRendus ?? []
  const ordonnances = patientData?.ordonnances ?? []

  useEffect(() => {
    setPhotoError(false)
  }, [patient?.photoIdentite, patientId])

  const { listening: listeningCr, startListening: startCr } = useVoiceInput((text) =>
    setNouveauCompteRendu((prev) => prev + text)
  )
  const { listening: listeningOrd, startListening: startOrd } = useVoiceInput((text) =>
    setNouvelleOrdonnance((prev) => prev + text)
  )

  const imprimerOrdonnance = (ord) => {
    if (!patient) return
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Ordonnance</title>
      <style>body{font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto}
      h1{color:#0E3B2E;font-size:1.5rem}h2{color:#1FA67A;font-size:1rem}
      .meta{color:#666;margin:20px 0}pre{white-space:pre-wrap;font-family:inherit}
      @media print{body{padding:20px}}</style></head><body>
      <h1>Ordonnance</h1>
      <div class="meta"><strong>${patient.nomComplet}</strong> — N° Sécu ${patient.numeroSecuriteSociale}</div>
      <div class="meta">${ord.date} – ${ord.medecin}</div>
      <pre>${ord.contenu}</pre>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 250)
  }

  const handleAddCompteRendu = async () => {
    if (!nouveauCompteRendu.trim()) return
    const date = formatDate()
    try {
      const created = await addCompteRendu(patientId, { date, contenu: nouveauCompteRendu.trim() })
      setPatientData((prev) => prev ? { ...prev, compteRendus: [created, ...(prev.compteRendus || [])] } : null)
      setNouveauCompteRendu('')
    } catch (e) {
      alert(e.message || 'Erreur enregistrement compte-rendu')
    }
  }

  const handleAddOrdonnance = async () => {
    if (!nouvelleOrdonnance.trim()) return
    const date = formatDate()
    const medecin = 'Dr. Martin'
    try {
      const created = await addOrdonnance(patientId, { date, medecin, contenu: nouvelleOrdonnance.trim() })
      setPatientData((prev) => prev ? { ...prev, ordonnances: [created, ...(prev.ordonnances || [])] } : null)
      setNouvelleOrdonnance('')
    } catch (e) {
      alert(e.message || 'Erreur enregistrement ordonnance')
    }
  }

  const handleDeleteCompteRendu = async (crId) => {
    if (!window.confirm('Supprimer ce compte-rendu ?')) return
    try {
      await deleteCompteRendu(patientId, crId)
      setPatientData((prev) => prev ? { ...prev, compteRendus: (prev.compteRendus || []).filter((cr) => cr.id !== crId) } : null)
    } catch (e) {
      alert(e.message || 'Erreur suppression')
    }
  }

  const handleDeleteOrdonnance = async (ordId) => {
    if (!window.confirm('Supprimer cette ordonnance ?')) return
    try {
      await deleteOrdonnance(patientId, ordId)
      setPatientData((prev) => prev ? { ...prev, ordonnances: (prev.ordonnances || []).filter((o) => o.id !== ordId) } : null)
    } catch (e) {
      alert(e.message || 'Erreur suppression')
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async () => {
      setPhotoUploading(true)
      try {
        const { photoIdentite } = await uploadPatientPhoto(patientId, reader.result)
        setPhotoError(false)
        const cacheBust = `${photoIdentite}?t=${Date.now()}`
        setPatientData((prev) => prev?.patient ? { ...prev, patient: { ...prev.patient, photoIdentite: cacheBust } } : null)
      } catch (err) {
        alert(err.message || 'Erreur enregistrement photo')
      } finally {
        setPhotoUploading(false)
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerPhotoInput = () => {
    if (!photoUploading) photoInputRef.current?.click()
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto min-h-full flex items-center justify-center py-12">
        <p className="text-darkGreen/60">Chargement du dossier patient...</p>
      </div>
    )
  }
  if (fetchError || !patient) {
    return (
      <div className="w-full max-w-5xl mx-auto min-h-full flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-red-600">{fetchError || 'Patient non trouvé.'}</p>
        <p className="text-darkGreen/60 text-sm">Vérifiez que l’API (server) tourne sur le port configuré.</p>
      </div>
    )
  }
  return (
    <div className="w-full max-w-5xl mx-auto min-h-full flex flex-col gap-6">
      <div className="text-center md:text-left">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-darkGreen tracking-tight">Informations patient</h2>
        <p className="text-darkGreen/60 mt-1 sm:mt-2 text-sm sm:text-[15px]">Fiche d'identification</p>
      </div>

      {/* Patient info */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center">
          <InfoField icon={User} label="Nom complet" value={patient.nomComplet} />
          <InfoField icon={Calendar} label="Date de naissance" value={patient.dateNaissance} />
          <InfoField icon={UserCircle} label="Sexe" value={patient.sexe} />
          <InfoField icon={Droplet} label="Groupe sanguin" value={patient.groupeSanguin} />
          <InfoField icon={CreditCard} label="Numéro de sécurité sociale" value={patient.numeroSecuriteSociale} />
          <InfoField icon={MapPin} label="Adresse complète" value={patient.adresseComplete} />
          <InfoField icon={Phone} label="Coordonnées" value={patient.coordonnees} />
          <InfoField icon={UserPlus} label="Personne à contacter" value={patient.personneAContacter} />
          <div className="flex flex-col items-center justify-center p-4 gap-3">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
              disabled={photoUploading}
              aria-label="Choisir une photo"
            />
            <button
              type="button"
              onClick={triggerPhotoInput}
              disabled={photoUploading}
              className="w-28 h-36 rounded-xl bg-darkGreen/[0.06] border border-darkGreen/10 flex flex-col items-center justify-center overflow-hidden hover:bg-darkGreen/[0.08] hover:border-primaryGreen/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primaryGreen/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {patient.photoIdentite && !photoError ? (
                <img
                  src={(config?.apiUrl || '') + patient.photoIdentite}
                  alt="Photo d'identité"
                  className="w-full h-full object-cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <>
                  <Image className="w-10 h-10 text-darkGreen/30 mb-2" strokeWidth={1.5} />
                  <span className="text-xs text-darkGreen/50">Photo d'identité</span>
                </>
              )}
            </button>
            <span className="text-xs font-medium text-primaryGreen cursor-pointer hover:underline" onClick={triggerPhotoInput} onKeyDown={(e) => e.key === 'Enter' && triggerPhotoInput()} role="button" tabIndex={0}>
              {photoUploading ? 'Envoi en cours…' : patient.photoIdentite ? 'Changer la photo' : 'Ajouter une photo'}
            </span>
          </div>
        </div>
      </Card>

      {/* Antécédents médicaux */}
      <Card>
        <h3 className="font-semibold text-darkGreen text-base sm:text-lg tracking-tight mb-6 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
          Antécédents médicaux
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-darkGreen/[0.02] border border-darkGreen/10">
            <p className="text-xs font-medium text-darkGreen/50 uppercase tracking-wider mb-2">Personnels</p>
            <p className="text-darkGreen text-[15px] leading-relaxed">{antecedents.personnels}</p>
          </div>
          <div className="p-4 rounded-xl bg-darkGreen/[0.02] border border-darkGreen/10">
            <p className="text-xs font-medium text-darkGreen/50 uppercase tracking-wider mb-2">Familiaux</p>
            <p className="text-darkGreen text-[15px] leading-relaxed">{antecedents.familiaux}</p>
          </div>
        </div>
      </Card>

      {/* Résultat / Compte-rendu */}
      <Card>
        <h3 className="font-semibold text-darkGreen text-base sm:text-lg tracking-tight mb-4 flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
          Résultat consultation / Compte-rendu
        </h3>
        <div className="space-y-2">
          {compteRendus.map((cr) => {
            const isOpen = expandedCrIds.has(cr.id)
            const preview = cr.contenu.replace(/\s+/g, ' ').slice(0, 60)
            return (
              <div key={cr.id} className="rounded-xl bg-darkGreen/[0.02] border border-darkGreen/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCr(cr.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-darkGreen/[0.04] transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-darkGreen/60 flex-shrink-0" strokeWidth={2} />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-darkGreen/60 flex-shrink-0" strokeWidth={2} />
                  )}
                  <span className="text-sm font-medium text-darkGreen/70">{cr.date}</span>
                  {!isOpen && (
                    <span className="flex-1 truncate text-darkGreen/60 text-sm">
                      {preview}{cr.contenu.length > 60 ? '…' : ''}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-darkGreen/10 p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-darkGreen text-[15px] whitespace-pre-line">{cr.contenu}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCompteRendu(cr.id)}
                      className="flex-shrink-0 p-2 rounded-lg text-darkGreen/50 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer ce compte-rendu"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <div className="p-4 rounded-xl bg-white border-2 border-dashed border-darkGreen/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
              <span className="text-sm font-medium text-darkGreen/60">Mode saisie</span>
              <div className="flex rounded-xl p-1 bg-darkGreen/[0.04] w-full sm:w-fit">
                <button
                  onClick={() => setInputModeCr('manual')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inputModeCr === 'manual'
                      ? 'bg-primaryGreen text-white shadow-sm'
                      : 'text-darkGreen/70 hover:text-darkGreen hover:bg-darkGreen/[0.04]'
                  }`}
                >
                  Manuel
                </button>
                <button
                  onClick={() => setInputModeCr('voice')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inputModeCr === 'voice'
                      ? 'bg-primaryGreen text-white shadow-sm'
                      : 'text-darkGreen/70 hover:text-darkGreen hover:bg-darkGreen/[0.04]'
                  }`}
                >
                  <Mic className="w-4 h-4" strokeWidth={2} />
                  Voix
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <textarea
                value={nouveauCompteRendu}
                onChange={(e) => setNouveauCompteRendu(e.target.value)}
                className="flex-1 min-h-[120px] px-4 py-3 rounded-xl border border-darkGreen/10 bg-darkGreen/[0.02] text-darkGreen placeholder-darkGreen/40 focus:outline-none focus:ring-2 focus:ring-primaryGreen/20 focus:border-primaryGreen/50 focus:bg-white resize-y text-sm sm:text-base"
                placeholder="Notes du médecin après la consultation..."
              />
              {inputModeCr === 'voice' && (
                <button
                  onClick={startCr}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 self-end transition-all ${
                    listeningCr ? 'bg-primaryGreen text-white animate-pulse' : 'bg-primaryGreen/15 text-primaryGreen hover:bg-primaryGreen/25'
                  }`}
                  title="Démarrer la dictée"
                >
                  <Mic className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
            </div>
            <Button onClick={handleAddCompteRendu} className="mt-4 rounded-xl py-3">
              Enregistrer et nouveau compte-rendu
            </Button>
          </div>
        </div>
      </Card>

      {/* Ordonnance - prescriptions */}
      <Card>
        <h3 className="font-semibold text-darkGreen text-base sm:text-lg tracking-tight mb-6 flex items-center gap-2">
          <Pill className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
          Ordonnance
        </h3>
        <div className="space-y-2">
          {ordonnances.map((ord) => {
            const isOpen = expandedOrdIds.has(ord.id)
            const preview = ord.contenu.replace(/\s+/g, ' ').slice(0, 50)
            return (
              <div key={ord.id} className="rounded-xl bg-darkGreen/[0.02] border border-darkGreen/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleOrd(ord.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-darkGreen/[0.04] transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-darkGreen/60 flex-shrink-0" strokeWidth={2} />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-darkGreen/60 flex-shrink-0" strokeWidth={2} />
                  )}
                  <span className="text-sm font-medium text-darkGreen/70">{ord.date}</span>
                  <span className="text-sm text-darkGreen/80">{ord.medecin}</span>
                  {!isOpen && (
                    <span className="flex-1 truncate text-darkGreen/50 text-sm">
                      {preview}{ord.contenu.length > 50 ? '…' : ''}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-darkGreen/10 p-4">
                    <p className="text-darkGreen text-[15px] whitespace-pre-line mb-4">{ord.contenu}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => imprimerOrdonnance(ord)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primaryGreen bg-primaryGreen/15 hover:bg-primaryGreen/25 transition-colors"
                      >
                        <Printer className="w-4 h-4" strokeWidth={2} />
                        Imprimer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrdonnance(ord.id)}
                        className="p-2 rounded-lg text-darkGreen/50 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer cette ordonnance"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Formulaire nouvelle ordonnance */}
          <div className="p-4 rounded-xl bg-white border-2 border-dashed border-darkGreen/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
              <p className="text-sm font-medium text-darkGreen/70">{formatDate()} – Dr. Martin</p>
              <div className="flex rounded-xl p-1 bg-darkGreen/[0.04] w-fit">
                <button
                  onClick={() => setInputModeOrd('manual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputModeOrd === 'manual' ? 'bg-primaryGreen text-white shadow-sm' : 'text-darkGreen/70 hover:bg-darkGreen/[0.04]'
                  }`}
                >
                  Manuel
                </button>
                <button
                  onClick={() => setInputModeOrd('voice')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputModeOrd === 'voice' ? 'bg-primaryGreen text-white shadow-sm' : 'text-darkGreen/70 hover:bg-darkGreen/[0.04]'
                  }`}
                >
                  <Mic className="w-4 h-4" strokeWidth={2} />
                  Voix
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <textarea
                value={nouvelleOrdonnance}
                onChange={(e) => setNouvelleOrdonnance(e.target.value)}
                className="flex-1 min-h-[120px] px-4 py-3 rounded-xl border border-darkGreen/10 bg-darkGreen/[0.02] text-darkGreen placeholder-darkGreen/40 focus:outline-none focus:ring-2 focus:ring-primaryGreen/20 focus:border-primaryGreen/50 focus:bg-white resize-y text-sm sm:text-base"
                placeholder="Ex : Paracétamol 1000 mg : 1 comprimé x 3/jour..."
              />
              {inputModeOrd === 'voice' && (
                <button
                  onClick={startOrd}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 self-end transition-all ${
                    listeningOrd ? 'bg-primaryGreen text-white animate-pulse' : 'bg-primaryGreen/15 text-primaryGreen hover:bg-primaryGreen/25'
                  }`}
                  title="Démarrer la dictée"
                >
                  <Mic className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
            </div>
            <Button onClick={handleAddOrdonnance} className="mt-4 rounded-xl py-3">
              Enregistrer et nouvelle ordonnance
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
