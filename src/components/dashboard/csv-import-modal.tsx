'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useDashboardContext } from '@/context/dashboard-context'

interface CsvImportModalProps {
  businessId: string
}

type Step = 'upload' | 'mapping' | 'preview' | 'success'

export function CsvImportModal({ businessId }: CsvImportModalProps) {
  const { isCsvModalOpen, setIsCsvModalOpen, refreshDashboard } = useDashboardContext()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  
  // Mapping state
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [totalRows, setTotalRows] = useState(0)
  
  // Import state
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setStep('upload')
    setFile(null)
    setMapping({})
    setDetectedColumns([])
    setPreviewRows([])
    setImportResult(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsCsvModalOpen(open)
    if (!open) {
      // Delay reset so animation finishes
      setTimeout(resetState, 300)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const parseFile = async () => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/csv/parse', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to parse file')

      const data = await res.json()
      setMapping(data.mapping)
      setPreviewRows(data.preview)
      setTotalRows(data.totalRows)
      setDetectedColumns(data.detectedColumns)
      setStep('mapping')
    } catch (err) {
      console.error(err)
      // Need proper error toast here in a real app
    } finally {
      setIsUploading(false)
    }
  }

  const downloadSample = () => {
    const csvContent = `date,item_name,category,quantity,unit_price,total
2024-04-20,Nasi Lemak,Main Course,2,12.00,24.00
2024-04-20,Teh Tarik,Drinks,3,3.50,10.50
2024-04-21,Mee Goreng,Main Course,1,10.00,10.00`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'fnb_sales_sample.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const doImport = async () => {
    setIsUploading(true)
    try {
      // In a real implementation we would parse the full file here on client
      // or send the file again. Since we don't have the full parsed rows in state,
      // we'll send the file again along with mapping to a new endpoint, OR
      // we just simulate for the hackathon using PapaParse client-side first.
      
      // Since we need to send ALL rows, let's just parse it client-side quickly
      const Papa = (await import('papaparse')).default
      
      const fileText = await file!.text()
      const parsed = Papa.parse(fileText, { header: true, skipEmptyLines: true })
      
      const res = await fetch('/api/csv/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsed.data,
          mapping,
          business_id: businessId,
        }),
      })

      if (!res.ok) throw new Error('Import failed')

      const result = await res.json()
      setImportResult(result)
      setStep('success')
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const REQUIRED_FIELDS = ['item_name', 'unit_price', 'sale_date']
  const isMappingValid = REQUIRED_FIELDS.every(field => mapping[field])

  return (
    <Dialog open={isCsvModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import POS Sales Data</DialogTitle>
          <DialogDescription>
            Upload your sales export CSV to populate the dashboard and get AI insights.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleUploadClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileSelect}
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-10 h-10 text-primary mb-3" />
                  <p className="font-medium text-lg">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}>
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-lg">Click or drag CSV file here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum file size: 5MB
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <Button variant="link" size="sm" onClick={downloadSample} className="px-0">
                Download sample CSV
              </Button>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button onClick={parseFile} disabled={!file || isUploading}>
                {isUploading ? 'Processing...' : 'Next Step'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6 py-4">
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <p>We've auto-detected some columns. Please review and map the required fields.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm border-b pb-2">Target Fields</h4>
                {['item_name', 'sale_date', 'unit_price', 'quantity_sold', 'total_revenue'].map((field) => (
                  <div key={field} className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {REQUIRED_FIELDS.includes(field) && <span className="text-destructive ml-1">*</span>}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-sm border-b pb-2">Your CSV Columns</h4>
                {['item_name', 'sale_date', 'unit_price', 'quantity_sold', 'total_revenue'].map((field) => (
                  <select
                    key={field}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={mapping[field] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                  >
                    <option value="">-- Ignore --</option>
                    {detectedColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={() => setStep('preview')} disabled={!isMappingValid}>
                Preview
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <p>Ready to import <strong>{totalRows}</strong> records. Existing data will be preserved.</p>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted px-4 py-2 text-sm font-medium border-b">
                Data Preview (First 5 rows)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{row[mapping.sale_date]}</td>
                        <td className="px-4 py-2 font-medium">{row[mapping.item_name]}</td>
                        <td className="px-4 py-2">{mapping.quantity_sold ? row[mapping.quantity_sold] : 1}</td>
                        <td className="px-4 py-2">{row[mapping.unit_price]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setStep('mapping')} disabled={isUploading}>
                Back
              </Button>
              <Button onClick={doImport} disabled={isUploading}>
                {isUploading ? 'Importing...' : 'Start Import'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'success' && importResult && (
          <div className="space-y-6 py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold">Import Successful!</h3>
              <p className="text-muted-foreground mt-2">
                Successfully imported <strong>{importResult.imported}</strong> sales records.
              </p>
              {importResult.skipped > 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  Skipped {importResult.skipped} rows due to errors.
                </p>
              )}
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => {
                  handleOpenChange(false)
                  refreshDashboard()
                }}
              >
                View Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
