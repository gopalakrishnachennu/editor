"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { ParsedData } from "@/lib/utils/csv-parser";
import { TemplateConfig } from "@/lib/templates";

interface BulkDataEditorProps {
    template: TemplateConfig;
    onDataChange: (data: ParsedData) => void;
}

interface RowData {
    id: string; // Internal ID for React keys
    [key: string]: string; // Field ID -> Value
}

export function BulkDataEditor({ template, onDataChange }: BulkDataEditorProps) {
    // Generate initial rows
    const [rows, setRows] = useState<RowData[]>([
        { id: '1', ...getEmptyRow(template) },
        { id: '2', ...getEmptyRow(template) },
        { id: '3', ...getEmptyRow(template) },
    ]);

    function getEmptyRow(t: TemplateConfig): Record<string, string> {
        const row: Record<string, string> = {};
        t.dataFields.forEach(field => {
            row[field.id] = "";
        });
        return row;
    }

    const updateRow = (id: string, field: string, value: string) => {
        const newRows = rows.map(r => r.id === id ? { ...r, [field]: value } : r);
        setRows(newRows);
        emitChange(newRows);
    };

    const addRow = () => {
        const newRow = { id: Date.now().toString(), ...getEmptyRow(template) };
        const newRows = [...rows, newRow];
        setRows(newRows);
        emitChange(newRows);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return; // Prevent deleting last row
        const newRows = rows.filter(r => r.id !== id);
        setRows(newRows);
        emitChange(newRows);
    };

    const emitChange = useCallback((currentRows: RowData[]) => {
        // Convert to ParsedData format
        const headers = template.dataFields.map(f => f.id);
        const dataRows = currentRows.map(r => {
            const { id, ...data } = r;
            // Ensure all headers are present
            const cleanRow: Record<string, string> = {};
            headers.forEach(h => cleanRow[h] = data[h] || "");
            return cleanRow;
        });

        onDataChange({
            headers,
            rows: dataRows,
            totalRows: dataRows.length
        });
    }, [template, onDataChange]);

    const handleImageUpload = (id: string, field: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        // Create local URL for preview/rendering
        const url = URL.createObjectURL(file);
        updateRow(id, field, url);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 text-center">#</th>
                            {template.dataFields.map(field => (
                                <th key={field.id} className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </th>
                            ))}
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row, index) => (
                            <tr key={row.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-center text-gray-400 text-sm font-mono">
                                    {index + 1}
                                </td>
                                {template.dataFields.map(field => (
                                    <td key={field.id} className="p-2">
                                        {field.type === 'image' ? (
                                            <div className="relative group/image">
                                                {row[field.id] ? (
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={row[field.id]}
                                                            alt="Preview"
                                                            className="w-10 h-10 rounded object-cover border border-gray-200 bg-gray-100"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs truncate text-gray-500 max-w-[120px]">
                                                                {row[field.id].startsWith('blob:') ? 'Uploaded Image' : row[field.id]}
                                                            </div>
                                                            <label className="text-xs text-indigo-600 cursor-pointer hover:underline">
                                                                Change
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleImageUpload(row.id, field.id, e.target.files)}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center justify-center gap-2 w-full h-10 px-3 border border-gray-200 border-dashed rounded-lg text-xs text-gray-500 hover:bg-white hover:border-indigo-400 cursor-pointer transition">
                                                        <Upload className="w-3.5 h-3.5" />
                                                        Upload
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(row.id, field.id, e.target.files)}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={row[field.id] || ""}
                                                onChange={(e) => updateRow(row.id, field.id, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        )}
                                    </td>
                                ))}
                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length <= 1}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                                        title="Remove row"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-center">
                <button
                    onClick={addRow}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-200"
                >
                    <Plus className="w-4 h-4" />
                    Add Row
                </button>
            </div>
        </div>
    );
}
