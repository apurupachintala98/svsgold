import React, { useState, useEffect } from 'react'
import { Upload, AlertCircle, CheckCircle, Camera, CreditCard, FileText, Building2, Image, FolderOpen } from 'lucide-react'

const DOCUMENT_SLOTS = [
  { key: 'Photo', label: 'Photo', icon: Camera, description: 'Passport-size photo' },
  { key: 'Aadhar', label: 'Aadhar', icon: CreditCard, description: 'Aadhar card (front & back)' },
  { key: 'PAN', label: 'PAN', icon: FileText, description: 'PAN card copy' },
  { key: 'Address Proof', label: 'Address Proof', icon: Image, description: 'Utility bill, Voter ID, etc.' },
  { key: 'Bank Details', label: 'Bank Details', icon: Building2, description: 'Passbook / Cancelled cheque' },
  { key: 'Others', label: 'Others', icon: FolderOpen, description: 'Any additional documents' },
]

export default function Documents({ isOpen, onToggle, data, onDataChange }) {
  // Initialize one slot per document type
  const initDocuments = () => {
    const existing = data.documents || []
    return DOCUMENT_SLOTS.map(slot => {
      const found = existing.find(d => d.document_type === slot.key)
      return found || {
        id: `doc_${slot.key}_${Date.now()}`,
        document_type: slot.key,
        document_number: '',
        file_path: '',
        file_name: '',
        file_size_mb: 0
      }
    })
  }

  const [documents, setDocuments] = useState(initDocuments)
  const [errors, setErrors] = useState({})

  // Sync to parent on mount
  useEffect(() => {
    onDataChange('documents', documents)
  }, [])

  const handleFileUpload = (index, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [`doc_${index}`]: 'File size must be less than 5MB' }))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const newDocuments = [...documents]
      newDocuments[index] = {
        ...newDocuments[index],
        file_name: file.name,
        file_size_mb: (file.size / (1024 * 1024)).toFixed(2),
        file_path: event.target.result
      }
      setDocuments(newDocuments)
      onDataChange('documents', newDocuments)
      setErrors(prev => { const n = { ...prev }; delete n[`doc_${index}`]; return n })
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (index) => {
    const newDocuments = [...documents]
    newDocuments[index] = {
      ...newDocuments[index],
      file_name: '',
      file_size_mb: 0,
      file_path: ''
    }
    setDocuments(newDocuments)
    onDataChange('documents', newDocuments)
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header — always visible, clicking toggles */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-amber-50/50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-800">Documents</span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {documents.filter(d => d.file_name).length}/{DOCUMENT_SLOTS.length} uploaded
          </span>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg">
          <Upload size={20} className="text-amber-700" />
        </div>
      </button>

      {/* Always show content — no collapse */}
      <div className="px-6 py-6 bg-gradient-to-b from-white/50 to-amber-50/30 border-t border-white/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, index) => {
            const slot = DOCUMENT_SLOTS[index]
            if (!slot) return null
            const Icon = slot.icon
            const hasFile = !!doc.file_name

            return (
              <div
                key={doc.document_type}
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  hasFile
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-200 bg-white/80 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    hasFile ? 'bg-green-100' : 'bg-amber-50'
                  }`}>
                    {hasFile
                      ? <CheckCircle size={20} className="text-green-600" />
                      : <Icon size={20} className="text-amber-700" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm">{slot.label}</h4>
                    <p className="text-xs text-gray-400">{slot.description}</p>
                  </div>
                </div>

                {/* Upload area */}
                {hasFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-green-200">
                      <FileText size={14} className="text-green-600 flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate flex-1">{doc.file_name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{doc.file_size_mb}MB</span>
                    </div>
                    <div className="flex gap-2">
                      <label
                        htmlFor={`file-${index}`}
                        className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        style={{ background: '#fdf8f0', color: '#a36e24' }}
                      >
                        Replace
                      </label>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`file-${index}`}
                    className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:bg-amber-50/50 transition-all duration-300"
                  >
                    <Upload size={20} className="text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">Click to upload</span>
                    <span className="text-[10px] text-gray-400">Max 5MB • PDF, JPG, PNG</span>
                  </label>
                )}

                <input
                  type="file"
                  onChange={(e) => handleFileUpload(index, e)}
                  className="hidden"
                  id={`file-${index}`}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                {errors[`doc_${index}`] && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors[`doc_${index}`]}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}