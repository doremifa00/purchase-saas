'use client'

import { useState, useEffect } from 'react'
import {
    ShoppingCart, Package, BarChart3, Settings,
    Search, Bell, User, Plus, Download, Filter,
    Calendar, DollarSign, TrendingUp, FileText, X, Check
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PurchaseItem } from '@/lib/supabase'

interface DeductionItem {
    id: string
    name: string
    name_en: string
    default_cost: number
}

interface PurchaseFormData {
    barcode: string
    imei: string
    serialNumber: string
    purchasePrice: number
    selectedDeductions: string[]
    additionalAmount: number
}

export default function PurchasePage() {
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
    const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [showForm, setShowForm] = useState(false)

    // Purchase form state
    const [formData, setFormData] = useState<PurchaseFormData>({
        barcode: '',
        imei: '',
        serialNumber: '',
        purchasePrice: 0,
        selectedDeductions: [],
        additionalAmount: 0
    })

    useEffect(() => {
        fetchData()
    }, [])

    // Test Deduction Items
    const TEST_DEDUCTION_ITEMS: DeductionItem[] = [
        { id: 'd1', name: 'Broken Screen', name_en: 'Broken Screen', default_cost: 50 },
        { id: 'd2', name: 'Bad Battery', name_en: 'Bad Battery', default_cost: 20 },
        { id: 'd3', name: 'Scratched Body', name_en: 'Scratched Body', default_cost: 15 },
        { id: 'd4', name: 'Broken Camera', name_en: 'Broken Camera', default_cost: 30 },
        { id: 'd5', name: 'No Face ID', name_en: 'No Face ID', default_cost: 40 },
    ]

    async function fetchData() {
        try {
            // Fetch purchase items
            const { data: items, error: itemsError } = await supabase
                .from('purchase_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (itemsError) throw itemsError
            setPurchaseItems(items || [])

            // Fetch deduction items
            const { data: deductions, error: deductionsError } = await supabase
                .from('deduction_items')
                .select('*')
                .eq('is_active', true)
                .order('sort_order')

            if (deductionsError) {
                console.warn('Error fetching deductions, using test items:', deductionsError)
                setDeductionItems(TEST_DEDUCTION_ITEMS)
            } else {
                // Combine fetched items with test items for now (or just use test items if DB is empty)
                // For this task, we prioritize the test items as requested
                const combinedDeductions = [...(deductions || []), ...TEST_DEDUCTION_ITEMS]
                // Remove duplicates if any (based on ID)
                const uniqueDeductions = Array.from(new Map(combinedDeductions.map(item => [item.id, item])).values())
                setDeductionItems(uniqueDeductions)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            // Fallback to test items on error
            setDeductionItems(TEST_DEDUCTION_ITEMS)
        } finally {
            setLoading(false)
        }
    }

    // Calculate deductions total
    const calculateDeductionsTotal = () => {
        return formData.selectedDeductions.reduce((total, deductionId) => {
            const deduction = deductionItems.find(d => d.id === deductionId)
            return total + (deduction?.default_cost || 0)
        }, 0)
    }

    // Calculate final price (REAL-TIME)
    const calculateFinalPrice = () => {
        const deductionsTotal = calculateDeductionsTotal()
        return formData.purchasePrice - deductionsTotal + formData.additionalAmount
    }

    const deductionsTotal = calculateDeductionsTotal()
    const finalPrice = calculateFinalPrice()

    // Toggle deduction selection
    const toggleDeduction = (deductionId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedDeductions: prev.selectedDeductions.includes(deductionId)
                ? prev.selectedDeductions.filter(id => id !== deductionId)
                : [...prev.selectedDeductions, deductionId]
        }))
    }

    // Save purchase (console log for now)
    const handleSave = () => {
        const purchaseData = {
            ...formData,
            deductionsTotal,
            finalPrice,
            timestamp: new Date().toISOString()
        }

        console.log('💾 SAVE PURCHASE DATA:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📦 Barcode:', purchaseData.barcode || 'N/A')
        console.log('📱 IMEI:', purchaseData.imei || 'N/A')
        console.log('🔢 Serial Number:', purchaseData.serialNumber || 'N/A')
        console.log('💵 Purchase Price: $' + purchaseData.purchasePrice.toLocaleString())
        console.log('➖ Deductions: -$' + purchaseData.deductionsTotal.toLocaleString())
        console.log('➕ Additional: +$' + purchaseData.additionalAmount.toLocaleString())
        console.log('✅ FINAL PRICE: $' + purchaseData.finalPrice.toLocaleString())
        console.log('🏷️  Selected Deductions:', formData.selectedDeductions.length)
        formData.selectedDeductions.forEach(id => {
            const deduction = deductionItems.find(d => d.id === id)
            if (deduction) {
                console.log(`  - ${deduction.name_en} (-$${deduction.default_cost})`)
            }
        })
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        alert(`✅ Purchase saved to console!\n\nFinal Price: $${purchaseData.finalPrice.toLocaleString()}\n\nCheck browser console for full details.`)
    }

    // Calculate metrics
    const totalItems = purchaseItems.length
    const totalCost = purchaseItems.reduce((sum, item) => sum + item.purchase_price, 0)
    const totalDeductions = purchaseItems.reduce((sum, item) => sum + item.deduction_total, 0)
    const finalTotal = purchaseItems.reduce((sum, item) => sum + item.final_price, 0)

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">PhoneSaaS</h1>
                            <p className="text-xs text-gray-500">Enterprise</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        <a href="#" className="sidebar-link">
                            <BarChart3 className="w-5 h-5" />
                            <span>Dashboard</span>
                        </a>
                        <a href="#" className="sidebar-link active">
                            <ShoppingCart className="w-5 h-5" />
                            <span>Purchases</span>
                        </a>
                        <a href="#" className="sidebar-link">
                            <Package className="w-5 h-5" />
                            <span>Inventory</span>
                        </a>
                        <a href="#" className="sidebar-link">
                            <FileText className="w-5 h-5" />
                            <span>Reports</span>
                        </a>
                        <a href="#" className="sidebar-link">
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </a>
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            H
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Hailey Kim</p>
                            <p className="text-xs text-gray-500">Premium Plan</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Purchase Management</h2>
                            <p className="text-sm text-gray-500 mt-1">Track and manage all your phone acquisitions</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search purchases..."
                                    className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell className="w-6 h-6 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <User className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto px-8 py-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    +12%
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Purchases</h3>
                            <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                            <p className="text-xs text-gray-500 mt-2">Items acquired</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    +8%
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Spent</h3>
                            <p className="text-3xl font-bold text-gray-900">${totalCost.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-2">Purchase cost</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                    -${totalDeductions.toLocaleString()}
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Deductions</h3>
                            <p className="text-3xl font-bold text-gray-900">${totalDeductions.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-2">Total reductions</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    Final
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Net Amount</h3>
                            <p className="text-3xl font-bold text-gray-900">${finalTotal.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-2">After deductions</p>
                        </div>
                    </div>

                    {/* New Purchase Form */}
                    {showForm && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">New Purchase Entry</h3>
                                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                {/* Basic Information */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Enter barcode"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">IMEI</label>
                                    <input
                                        type="text"
                                        value={formData.imei}
                                        onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Enter IMEI"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                                    <input
                                        type="text"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Enter serial number"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price ($)</label>
                                    <input
                                        type="number"
                                        value={formData.purchasePrice || ''}
                                        onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Amount ($)</label>
                                    <input
                                        type="number"
                                        value={formData.additionalAmount || ''}
                                        onChange={(e) => setFormData({ ...formData, additionalAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                    <label className="block text-sm font-semibold text-green-800 mb-1">Final Price</label>
                                    <p className="text-3xl font-bold text-green-600">
                                        ${finalPrice.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">Calculated automatically</p>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Deduction Items</h4>
                                <div className="grid grid-cols-5 gap-3">
                                    {deductionItems.map((deduction) => (
                                        <label
                                            key={deduction.id}
                                            className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${formData.selectedDeductions.includes(deduction.id)
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedDeductions.includes(deduction.id)}
                                                onChange={() => toggleDeduction(deduction.id)}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{deduction.name_en}</p>
                                                <p className="text-xs text-gray-500">-${deduction.default_cost}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {formData.selectedDeductions.length > 0 && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-red-900">Total Deductions:</span>
                                            <span className="text-lg font-bold text-red-600">-${deductionsTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Calculation Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Calculation Summary</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Purchase Price:</span>
                                        <span className="font-semibold text-gray-900">${formData.purchasePrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Deductions:</span>
                                        <span className="font-semibold text-red-600">-${deductionsTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Additional Amount:</span>
                                        <span className="font-semibold text-green-600">+${formData.additionalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="text-base font-bold text-gray-900">Final Price:</span>
                                            <span className="text-xl font-bold text-green-600">${finalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setFormData({
                                            barcode: '',
                                            imei: '',
                                            serialNumber: '',
                                            purchasePrice: 0,
                                            selectedDeductions: [],
                                            additionalAmount: 0
                                        })
                                    }}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Purchase
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filters and Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'all'
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        All Items
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'pending'
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Pending Inspection
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('completed')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'completed'
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Completed
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                        <Filter className="w-4 h-4" />
                                        Filters
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Purchase
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Barcode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Model
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Serial Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IMEI
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Purchase Cost
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Deductions
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Final Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                                    <p className="text-sm text-gray-500">Loading purchases...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : purchaseItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-gray-100 rounded-full">
                                                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900 mb-1">No purchases yet</h3>
                                                        <p className="text-sm text-gray-500">Get started by creating your first purchase record.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowForm(true)}
                                                        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                                                    >
                                                        Add Purchase
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        purchaseItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <input type="checkbox" className="rounded border-gray-300" />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {item.barcode || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {item.product_id || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {item.serial_number || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                                    {item.imei || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                                    ${item.purchase_price.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right text-red-600">
                                                    -${item.deduction_total.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                                                    ${item.final_price.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pending Inspection
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {purchaseItems.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">1</span> to{' '}
                                        <span className="font-medium">{purchaseItems.length}</span> of{' '}
                                        <span className="font-medium">{purchaseItems.length}</span> results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                                            Previous
                                        </button>
                                        <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
