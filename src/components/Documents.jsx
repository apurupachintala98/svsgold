import React, { useState } from 'react'
import { ChevronDown, Upload, Trash2, AlertCircle } from 'lucide-react'

export default function Documents({ isOpen, onToggle, data, onDataChange }) {
  const [documents, setDocuments] = useState(data.documents || [])
  const [errors, setErrors] = useState({})

  const documentTypes = ['Aadhar Card', 'PAN Card', 'Passport', 'Driving License', 'Voter ID', 'Bank Statement', 'Address Proof', 'Business License', 'GST Certificate', 'Other']

  const handleDocumentChange = (index, field, value) => {
    const newDocuments = [...documents]
    newDocuments[index] = {
      ...newDocuments[index],
      [field]: value
    }
    setDocuments(newDocuments)
    onDataChange('documents', newDocuments)
  }

  const handleFileUpload = (index, e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        const newErrors = { ...errors }
        newErrors[`doc_${index}_file`] = 'File size must be less than 5MB'
        setErrors(newErrors)
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

        const newErrors = { ...errors }
        delete newErrors[`doc_${index}_file`]
        setErrors(newErrors)
      }
      reader.readAsDataURL(file)
    }
  }

  const addNewDocument = () => {
    const newDoc = {
      id: Date.now(),
      document_type: 'Aadhar Card',
      document_number: '',
      file_path: '',
      file_name: '',
      file_size_mb: 0
    }
    setDocuments([...documents, newDoc])
  }

  const removeDocument = (index) => {
    const newDocuments = documents.filter((_, i) => i !== index)
    setDocuments(newDocuments)
    onDataChange('documents', newDocuments)
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <button
      type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300"
      >
        <span className="text-lg font-semibold text-gray-800">Documents</span>
        <div className="p-2 bg-indigo-50 rounded-lg">
          <ChevronDown
            size={24}
            className={`text-indigo-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content space-y-6 px-6 py-6 bg-gradient-to-b from-white/50 to-indigo-50/30 border-t border-white/50">
          {documents.length === 0 ? (
            <button
              onClick={addNewDocument}
              className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Add First Document
            </button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc, index) => (
                <div key={doc.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border-2 border-indigo-100/50 space-y-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">Document {index + 1}</h3>
                    <button
                      onClick={() => removeDocument(index)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-all duration-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Document Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Document Type
                    </label>
                    <select
                      value={doc.document_type}
                      onChange={(e) => handleDocumentChange(index, 'document_type', e.target.value)}
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    >
                      {documentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Document Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={doc.document_number}
                      onChange={(e) => handleDocumentChange(index, 'document_number', e.target.value)}
                      placeholder={`Enter ${doc.document_type} number`}
                      className="w-full px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Upload Document
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(index, e)}
                        className="hidden"
                        id={`file-${index}`}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label
                        htmlFor={`file-${index}`}
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-indigo-400 rounded-xl cursor-pointer hover:bg-indigo-50 transition-all duration-300"
                      >
                        <Upload size={20} className="text-indigo-600" />
                        <span className="text-indigo-600 font-semibold">
                          {doc.file_name ? `${doc.file_name} (${doc.file_size_mb}MB)` : 'Click to upload'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">Max size: 5MB. Formats: PDF, JPG, PNG, DOC</p>
                    </div>
                    {errors[`doc_${index}_file`] && (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors[`doc_${index}_file`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {documents.length > 0 && (
            <button
              onClick={addNewDocument}
              className="w-full py-3 border-2 border-dashed border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Add Another Document
            </button>
          )}
        </div>
      )}
    </div>
  )
}
