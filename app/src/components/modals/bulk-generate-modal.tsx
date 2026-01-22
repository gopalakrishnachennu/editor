"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Check, AlertCircle, ArrowRight, Download, RefreshCw } from "lucide-react";
import { ParsedData, parseFile, suggestMapping } from "@/lib/utils/csv-parser";
import { TemplateConfig } from "@/lib/templates";

interface BulkGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: TemplateConfig;
    onGenerate: (data: ParsedData, mapping: Record<string, string>) => Promise<void>;
}

export function BulkGenerateModal({ isOpen, onClose, template, onGenerate }: BulkGenerateModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = async (uploadedFile: File) => {
        try {
            setFile(uploadedFile);
            setIsProcessing(true);
            const data = await parseFile(uploadedFile);
            setParsedData(data);

            // Auto-suggest mapping
            const suggested = suggestMapping(
                data.headers,
                template.dataFields.map(f => ({ id: f.id, label: f.label }))
            );
            setMapping(suggested);

            setStep(2);
        } catch (error) {
            console.error(error);
            alert("Failed to parse file");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMappingChange = (fieldId: string, header: string) => {
        setMapping(prev => ({
            ...prev,
            [fieldId]: header
        }));
    };

    const handleGenerate = async () => {
        if (!parsedData) return;
        setIsProcessing(true);
        try {
            await onGenerate(parsedData, mapping);
            // onClose(); // Let parent handle close or show success
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Bulk Generate</h2>
                            <p className="text-sm text-gray-500">
                                {step === 1 && "Start by uploading your data file"}
                                {step === 2 && "Map your data columns to template fields"}
                                {step === 3 && "Preview and generate"}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {step === 1 && (
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-500 hover:bg-indigo-50/50 transition cursor-pointer"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleFileUpload(file);
                                }}
                            >
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-900">Upload CSV or JSON</h3>
                                    <p className="text-gray-500 mt-1">Drag & drop or click to browse</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv,.json"
                                    className="hidden"
                                    id="bulk-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />
                                <label
                                    htmlFor="bulk-upload"
                                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                >
                                    Select File
                                </label>
                            </div>
                        )}

                        {step === 2 && parsedData && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm mb-4">
                                    <FileText className="w-4 h-4" />
                                    <span>Found <strong>{parsedData.totalRows} rows</strong> in {file?.name}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b">Template Field</div>
                                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b">Data Column</div>

                                    {template.dataFields.map(field => (
                                        <div key={field.id} className="contents display-grid">
                                            <div className="flex items-center gap-2 py-2">
                                                <div className={`w-2 h-2 rounded-full ${mapping[field.id] ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                <span className="font-medium text-gray-700">{field.label}</span>
                                                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">
                                                    {field.id}
                                                </span>
                                            </div>
                                            <div className="py-2">
                                                <select
                                                    value={mapping[field.id] || ""}
                                                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">-- Select Column --</option>
                                                    {parsedData.headers.map(header => (
                                                        <option key={header} value={header}>{header}</option>
                                                    ))}
                                                </select>
                                                {/* Preview value */}
                                                {mapping[field.id] && parsedData.rows.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                                        e.g. {parsedData.rows[0][mapping[field.id]]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between">
                        {step === 1 ? (
                            <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">
                                Cancel
                            </button>
                        ) : (
                            <button onClick={() => setStep(step - 1 as any)} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">
                                Back
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={handleGenerate}
                                disabled={isProcessing}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        Generate {parsedData?.totalRows} Posts
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
