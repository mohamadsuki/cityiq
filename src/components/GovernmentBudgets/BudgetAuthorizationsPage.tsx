import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataUploader } from "@/components/shared/DataUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileCheck, AlertCircle, Clock, CheckCircle, DollarSign, Upload, CalendarIcon, Edit, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// נתונים לדוגמה - בעתיד יבואו מהדאטאבייס
const mockAuthorizations = [
  {
    id: "1",
    authorization_number: "הר-2024-001",
    ministry: "משרד החינוך",
    program: "תוכנית חינוך מיוחד",
    amount: 150000,
    status: "approved",
    submitted_at: "2024-01-15",
    approved_at: "2024-02-01",
    valid_until: "2024-12-31",
    purpose: "הקמת כיתות חינוך מיוחד",
    department_slug: "education",
    notes: "הרשאה לפיתוח תוכנית חינוך מיוחד בבתי הספר"
  },
  {
    id: "2", 
    authorization_number: "הר-2024-002",
    ministry: "משרד הרווחה",
    program: "תמיכה בקשישים",
    amount: 85000,
    status: "pending",
    submitted_at: "2024-02-10",
    approved_at: null,
    valid_until: "2024-11-30",
    purpose: "שירותי תמיכה לאוכלוסיית קשישים",
    department_slug: "welfare",
    notes: "ממתין לאישור מליאה"
  },
  {
    id: "3",
    authorization_number: "הר-2024-003", 
    ministry: "משרד הפנים",
    program: "פיתוח תשתיות",
    amount: 320000,
    status: "in_review",
    submitted_at: "2024-03-05",
    approved_at: null,
    valid_until: "2025-03-31",
    purpose: "שיפור תשתיות עירוניות",
    department_slug: "engineering",
    notes: "בבדיקה משפטית"
  }
];

const statusLabels = {
  pending: { label: "ממתין לאישור", color: "bg-yellow-500", icon: Clock },
  in_review: { label: "בבדיקה", color: "bg-blue-500", icon: AlertCircle },
  approved: { label: "אושר", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "נדחה", color: "bg-red-500", icon: AlertCircle }
};

export default function BudgetAuthorizationsPage() {
  const [authorizations, setAuthorizations] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusUpdateId, setStatusUpdateId] = useState<string>('');
  const [showNewAuthDialog, setShowNewAuthDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAuth, setEditingAuth] = useState<any>(null);
  const [filteredAuthorizations, setFilteredAuthorizations] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [newAuthData, setNewAuthData] = useState({
    authorization_number: '',
    ministry: '',
    program: '',
    purpose: '',
    amount: '',
    valid_until: '',
    department_slug: 'finance',
    notes: ''
  });
  const { toast } = useToast();

  const fetchAuthorizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_authorizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('🔍 Raw fetched authorizations:', data);
      
      // If no data, use mock data
      if (!data || data.length === 0) {
        console.log('No data found, using mock data');
        setAuthorizations(mockAuthorizations);
      } else {
        // Filter out the total sum row (33,413,631) - it has no program description
        const filteredData = data.filter(item => 
          item.program && 
          item.program.trim() && 
          item.amount !== 33413631 // Remove the total sum row
        );

        // Map the data correctly based on the actual Excel structure
        const cleanedData = filteredData.map(item => {
          console.log('🔍 Processing item:', item);
          
          // Extract approval date first from both sources
          const dateFromNotes = extractDateFromNotes(item.notes);
          const approvalDate = item.approved_at || dateFromNotes;
          
          const cleanedItem = {
            ...item,
            // authorization_number should be the ministry field (which contains the actual codes)
            authorization_number: item.ministry || item.authorization_number?.toString() || 'לא צוין',
            // program contains the actual authorization description
            program: item.program || 'לא צוין',
            // purpose contains the tabar number - leave empty if not specified
            purpose: item.purpose || '',
            // amount is correct
            amount: item.amount || 0,
            // ministry - map from the authorization_number field or extract from program
            ministry: mapSequenceToMinistry(item.authorization_number, item.program),
            // valid_until - use actual valid_until from Excel, don't calculate if empty
            valid_until: item.valid_until || calculateValidityDate(approvalDate),
            // department_slug - map based on program content
            department_slug: mapProgramToDepartment(item.program),
            // approved_at - priority to approved_at field, then notes
            approved_at: approvalDate,
            // status - automatically set to approved if we have approval date
            status: approvalDate ? 'approved' : (item.status || 'pending'),
            // notes - only use actual notes column if it has content (not dates)
            notes: cleanNotes(item.notes)
          };
          
          console.log('🔍 Cleaned item:', cleanedItem);
          return cleanedItem;
        });
        
        setAuthorizations(cleanedData);
      }
    } catch (error) {
      console.error('Error fetching authorizations:', error);
      console.log('Using mock data due to error');
      setAuthorizations(mockAuthorizations);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter authorizations by category
  const handleFilterByCategory = (category: string) => {
    const today = new Date();
    const filtered = authorizations.filter(auth => {
      if (!auth.valid_until) return false;
      
      const validUntil = new Date(auth.valid_until);
      const monthsDiff = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      let authCategory = '';
      if (monthsDiff < 0) {
        authCategory = 'פג תוקף';
      } else if (monthsDiff <= 3) {
        authCategory = 'פג תוקף עד 3 חודשים';
      } else if (monthsDiff <= 6) {
        authCategory = 'פג תוקף עד 6 חודשים';
      } else if (monthsDiff <= 12) {
        authCategory = 'פג תוקף עד שנה';
      } else {
        authCategory = 'תקף למעלה משנה';
      }
      
      return authCategory === category;
    });
    
    setFilteredAuthorizations(filtered);
    setFilterCategory(category);
  };

  // Function to clear filter
  const clearFilter = () => {
    setFilteredAuthorizations([]);
    setFilterCategory('');
  };

  const fetchGrants = async () => {
    try {
      console.log('🔍 Fetching grants from database...');
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('✅ Grants fetched successfully:', data);
      console.log('✅ Number of grants:', data?.length || 0);
      console.log('✅ Approved grants:', data?.filter(g => g.status === 'אושר').length || 0);
      console.log('✅ Total approved amount:', data?.filter(g => g.status === 'אושר').reduce((sum, g) => sum + (g.amount || 0), 0) || 0);
      setGrants(data || []);
    } catch (error) {
      console.error('❌ Error fetching grants:', error);
      setGrants([]);
    }
  };

  // Map sequence number to ministry based on patterns
  const mapSequenceToMinistry = (seqNumber: any, program: string): string => {
    const seq = seqNumber?.toString() || '';
    const prog = program || '';
    
    // Educational institutions
    if (prog.includes('חט"ע') || prog.includes('כיתות לימוד') || prog.includes('בית ספר') || prog.includes('גן')) {
      return 'משרד החינוך';
    }
    
    // Sports and culture
    if (prog.includes('ספורט') || prog.includes('אולם') || prog.includes('אצטדיון')) {
      return 'משרד התרבות והספורט';
    }
    
    // Health
    if (prog.includes('טיפת חלב') || prog.includes('בריאות')) {
      return 'משרד הבריאות';
    }
    
    // Security and enforcement
    if (prog.includes('אכיפה') || prog.includes('חירום') || prog.includes('בטחון')) {
      return 'משרד הבטחון הפנימי';
    }
    
    // Infrastructure and construction
    if (prog.includes('בניה') || prog.includes('שיפוץ') || prog.includes('תשתית') || prog.includes('תכנון')) {
      return 'משרד הפנים';
    }
    
    // Environment and energy
    if (prog.includes('אנרגיה') || prog.includes('סביבה')) {
      return 'משרד האנרגיה';
    }
    
    return 'משרד הפנים'; // Default
  };

  // Map program to department
  const mapProgramToDepartment = (program: string): string => {
    const prog = program || '';
    
    if (prog.includes('חט"ע') || prog.includes('כיתות לימוד') || prog.includes('בית ספר')) {
      return 'education';
    }
    if (prog.includes('ספורט') || prog.includes('תרבות')) {
      return 'non-formal';
    }
    if (prog.includes('בניה') || prog.includes('תכנון') || prog.includes('הנדס')) {
      return 'engineering';
    }
    if (prog.includes('רווחה') || prog.includes('טיפת חלב') || prog.includes('קשישים')) {
      return 'welfare';
    }
    
    return 'finance'; // Default
  };

  // Calculate validity date (typically 1 year from approval date)
  const calculateValidityDate = (approvalDate: string | null): string | null => {
    if (!approvalDate) {
      // If no approval date, don't create fake validity date
      return null;
    }
    
    try {
      const approval = new Date(approvalDate);
      // Add 1 year to approval date
      approval.setFullYear(approval.getFullYear() + 1);
      return approval.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // Extract date from notes (format: dd.mm.yyyy)
  const extractDateFromNotes = (notes: string): string | null => {
    if (!notes) return null;
    
    const dateMatch = notes.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      // Convert to ISO format
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
  };

  // Clean notes - remove dates, keep only actual notes
  const cleanNotes = (notes: string): string => {
    if (!notes || !notes.trim()) return '';
    
    // If notes contain only dates, return empty string
    // Otherwise, keep the full notes content
    const datePattern = /^\d{1,2}\.\d{1,2}\.\d{4}\s*$/;
    if (datePattern.test(notes.trim())) {
      return '';
    }
    
    return notes.trim();
  };

  const updateAuthorizationStatus = async (id: string, newStatus: string) => {
    try {
      // If changing to approved, show date picker
      if (newStatus === 'approved') {
        setStatusUpdateId(id);
        setShowDatePicker(true);
        return;
      } else {
        // For other status changes, clear approval date if changing from approved
        const currentAuth = authorizations.find(a => a.id === id);
        const updateData: any = { status: newStatus };
        
        if (currentAuth?.status === 'approved' && newStatus !== 'approved') {
          updateData.approved_at = null;
        }

        const { error } = await supabase
          .from('budget_authorizations')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        // Update local state
        setAuthorizations(prev => 
          prev.map(auth => 
            auth.id === id ? { ...auth, ...updateData } : auth
          )
        );

        toast({
          title: "הצלחה",
          description: "הסטטוס עודכן בהצלחה",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive",
      });
    }
  };

  const handleDateConfirm = async () => {
    if (!selectedDate || !statusUpdateId) {
      toast({
        title: "שגיאה",
        description: "נא לבחור תאריך",
        variant: "destructive",
      });
      return;
    }

    try {
      const approvalDate = format(selectedDate, 'yyyy-MM-dd');

      // Update both status and approval date
      const { error } = await supabase
        .from('budget_authorizations')
        .update({ 
          status: 'approved',
          approved_at: approvalDate
        })
        .eq('id', statusUpdateId);

      if (error) throw error;

      // Update local state
      setAuthorizations(prev => 
        prev.map(auth => 
          auth.id === statusUpdateId ? { ...auth, status: 'approved', approved_at: approvalDate } : auth
        )
      );

      setShowDatePicker(false);
      setSelectedDate(undefined);
      setStatusUpdateId('');

      toast({
        title: "הצלחה",
        description: "הסטטוס עודכן בהצלחה",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewAuth = async () => {
    try {
      // Validate required fields
      if (!newAuthData.authorization_number || !newAuthData.ministry || !newAuthData.program || !newAuthData.amount) {
        toast({
          title: "שגיאה",
          description: "נא למלא את כל השדות הנדרשים",
          variant: "destructive",
        });
        return;
      }

      const authData = {
        ...newAuthData,
        amount: parseFloat(newAuthData.amount) || 0,
        status: 'pending' as const,
        user_id: '11111111-1111-1111-1111-111111111111', // Demo user ID
        department_slug: newAuthData.department_slug as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('budget_authorizations')
        .insert(authData)
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setAuthorizations(prev => [data, ...prev]);
      
      // Reset form
      setNewAuthData({
        authorization_number: '',
        ministry: '',
        program: '',
        purpose: '',
        amount: '',
        valid_until: '',
        department_slug: 'finance',
        notes: ''
      });
      
      setShowNewAuthDialog(false);

      toast({
        title: "הצלחה",
        description: "ההרשאה נוספה בהצלחה",
      });
    } catch (error) {
      console.error('Error creating authorization:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את ההרשאה",
        variant: "destructive",
      });
    }
  };

  const handleEditAuth = (auth: any) => {
    setEditingAuth(auth);
    setNewAuthData({
      authorization_number: auth.authorization_number || '',
      ministry: auth.ministry || '',
      program: auth.program || '',
      purpose: auth.purpose || '',
      amount: auth.amount?.toString() || '',
      valid_until: auth.valid_until || '',
      department_slug: auth.department_slug || 'finance',
      notes: auth.notes || ''
    });
    setShowEditDialog(true);
  };

  const handleDeleteAuth = async (authId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הרשאה זו?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budget_authorizations')
        .delete()
        .eq('id', authId);

      if (error) throw error;

      // Update local state
      setAuthorizations(prev => prev.filter(auth => auth.id !== authId));

      toast({
        title: "הצלחה",
        description: "ההרשאה נמחקה בהצלחה",
      });
    } catch (error) {
      console.error('Error deleting authorization:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את ההרשאה",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAuth = async () => {
    try {
      // Validate required fields
      if (!newAuthData.authorization_number || !newAuthData.ministry || !newAuthData.program || !newAuthData.amount) {
        toast({
          title: "שגיאה",
          description: "נא למלא את כל השדות הנדרשים",
          variant: "destructive",
        });
        return;
      }

      const updateData = {
        authorization_number: newAuthData.authorization_number,
        ministry: newAuthData.ministry,
        program: newAuthData.program,
        purpose: newAuthData.purpose,
        amount: parseFloat(newAuthData.amount) || 0,
        valid_until: newAuthData.valid_until || null,
        department_slug: newAuthData.department_slug as any,
        notes: newAuthData.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('budget_authorizations')
        .update(updateData)
        .eq('id', editingAuth.id);

      if (error) throw error;

      // Update local state
      setAuthorizations(prev => 
        prev.map(auth => 
          auth.id === editingAuth.id ? { ...auth, ...updateData } : auth
        )
      );
      
      // Reset form
      setNewAuthData({
        authorization_number: '',
        ministry: '',
        program: '',
        purpose: '',
        amount: '',
        valid_until: '',
        department_slug: 'finance',
        notes: ''
      });
      
      setShowEditDialog(false);
      setEditingAuth(null);

      toast({
        title: "הצלחה",
        description: "ההרשאה עודכנה בהצלחה",
      });
    } catch (error) {
      console.error('Error updating authorization:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את ההרשאה",
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    setShowUploader(false);
    fetchAuthorizations();
    toast({
      title: "הצלחה",
      description: "הקובץ הועלה בהצלחה והנתונים נשמרו",
    });
  };

  useEffect(() => {
    fetchAuthorizations();
    fetchGrants();
  }, []);

  const columns = [
    {
      accessorKey: "authorization_number",
      header: "מספר הרשאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return value || 'לא צוין';
      }
    },
    {
      accessorKey: "ministry",
      header: "משרד מממן",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return value || 'לא צוין';
      }
    },
    {
      accessorKey: "program",
      header: "תיאור ההרשאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return value || 'לא צוין';
      }
    },
    {
      accessorKey: "purpose",
      header: "מס' תב\"ר",
      enableSorting: true
    },
    {
      accessorKey: "amount",
      header: "סכום ההרשאה (₪)",
      enableSorting: true,
      cell: ({ getValue }: any) => new Intl.NumberFormat('he-IL').format(getValue() || 0)
    },
    {
      accessorKey: "valid_until",
      header: "תוקף ההרשאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        if (!value) return 'לא הוגדר תוקף';
        try {
          const date = new Date(value);
          return date.toLocaleDateString('he-IL');
        } catch {
          return 'תאריך לא תקין';
        }
      }
    },
    {
      accessorKey: "department_slug",
      header: "מחלקה מטפלת",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        const deptMap: Record<string, string> = {
          'finance': 'כספים',
          'engineering': 'הנדסה',
          'education': 'חינוך',
          'welfare': 'רווחה',
          'non-formal': 'תרבות'
        };
        return deptMap[value] || value || 'כספים';
      }
    },
    {
      accessorKey: "approved_at", 
      header: "תאריך אישור מליאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        if (!value) return 'ממתין לאישור';
        try {
          return new Date(value).toLocaleDateString('he-IL');
        } catch {
          return 'תאריך לא תקין';
        }
      }
    },
    {
      accessorKey: "notes",
      header: "הערות",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return value && value.trim() ? value : '';
      }
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }: any) => {
        const auth = row.original;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditAuth(auth)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteAuth(auth.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  const handleExport = () => {
    console.log(`Exporting authorizations`);
  };

  // סטטיסטיקות מהירות - חישוב נכון של סכום ההרשאות התקציביות
  const validAuthorizations = authorizations.filter(auth => 
    auth.program && 
    auth.program.trim() && 
    typeof auth.amount === 'number' && 
    auth.amount > 0
  );
  
  // חישוב סטטיסטיקות קולות קוראים
  const STATUS_LABELS: Record<string, string> = {
    'הוגש': 'הוגש',
    'אושר': 'אושר',
    'נדחה': 'נדחה',
    'לא רלוונטי': 'לא רלוונטי',
    // Map English statuses to Hebrew
    'SUBMITTED': 'הוגש',
    'APPROVED': 'אושר',
    'REJECTED': 'נדחה',
    'NOT_RELEVANT': 'לא רלוונטי',
    'submitted': 'הוגש',
    'approved': 'אושר',
    'rejected': 'נדחה',
    'not_relevant': 'לא רלוונטי',
  };

  const approvedGrants = grants.filter(g => {
    const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
    return hebrewStatus === 'אושר';
  });

  // Calculate approved grants amount using approved_amount or submission_amount if available, otherwise amount
  const approvedGrantsAmount = approvedGrants.reduce((sum, g) => {
    // Use approved_amount if available, otherwise submission_amount, otherwise amount
    const grantAmount = g.approved_amount || g.submission_amount || g.amount || 0;
    return sum + grantAmount;
  }, 0);

  // Calculate total grants amount (like in grants page)
  const totalGrantsAmount = grants.reduce((sum, g) => sum + (g.amount || 0), 0);
  
  const stats = {
    total: validAuthorizations.length,
    approved: validAuthorizations.filter(a => a.approved_at).length,
    pending: validAuthorizations.filter(a => !a.approved_at).length,
    totalAmount: validAuthorizations.reduce((sum, a) => sum + (a.amount || 0), 0),
    approvedAmount: validAuthorizations.filter(a => a.approved_at).reduce((sum, a) => sum + (a.amount || 0), 0),
    grantsTotal: grants.length,
    approvedGrantsCount: approvedGrants.length,
    approvedGrantsAmount: approvedGrantsAmount,
    totalGrantsAmount: totalGrantsAmount
  };

  // נתוני גרפים
  const statusData = [
    { name: 'מאושרות', value: stats.approved, color: '#10B981', icon: '✓' },
    { name: 'ממתינות', value: stats.pending, color: '#F59E0B', icon: '⏳' },
    { name: 'בבדיקה', value: authorizations.filter(a => a.status === 'in_review').length, color: '#3B82F6', icon: '👁️' },
    { name: 'נדחו', value: authorizations.filter(a => a.status === 'rejected').length, color: '#EF4444', icon: '✗' }
  ]; // Show all statuses, even if value is 0

  const ministryData = authorizations.reduce((acc: any[], auth) => {
    const existing = acc.find(item => item.ministry === auth.ministry);
    if (existing) {
      existing.count += 1;
      existing.amount += auth.amount || 0;
    } else {
      acc.push({
        ministry: auth.ministry || 'לא צוין',
        count: 1,
        amount: auth.amount || 0
      });
    }
    return acc;
  }, []).map((item, index) => ({
    ...item,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][index % 6]
  }));

  const departmentData = authorizations.reduce((acc: any[], auth) => {
    const deptMap: Record<string, string> = {
      'finance': 'כספים',
      'engineering': 'הנדסה', 
      'education': 'חינוך',
      'welfare': 'רווחה',
      'non-formal': 'תרבות'
    };
    const deptName = deptMap[auth.department_slug] || auth.department_slug || 'לא צוין';
    const existing = acc.find(item => item.department === deptName);
    if (existing) {
      existing.count += 1;
      existing.amount += auth.amount || 0;
    } else {
      acc.push({
        department: deptName,
        count: 1,
        amount: auth.amount || 0
      });
    }
    return acc;
  }, []).map((item, index) => ({
    ...item,
    color: ['#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'][index % 6]
  }));

  // נתונים לתרשים תוקף ההרשאות
  const validityData = authorizations.reduce((acc: any[], auth) => {
    if (!auth.valid_until) return acc;
    
    const today = new Date();
    const validUntil = new Date(auth.valid_until);
    const monthsDiff = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    let category = '';
    if (monthsDiff < 0) {
      category = 'פג תוקף';
    } else if (monthsDiff <= 3) {
      category = 'פג תוקף עד 3 חודשים';
    } else if (monthsDiff <= 6) {
      category = 'פג תוקף עד 6 חודשים';
    } else if (monthsDiff <= 12) {
      category = 'פג תוקף עד שנה';
    } else {
      category = 'תקף למעלה משנה';
    }
    
    const existing = acc.find(item => item.category === category);
    if (existing) {
      existing.count += 1;
      existing.amount += auth.amount || 0;
    } else {
      acc.push({
        category,
        count: 1,
        amount: auth.amount || 0
      });
    }
    return acc;
  }, []).map((item, index) => ({
    ...item,
    color: ['#EF4444', '#F59E0B', '#FBBF24', '#10B981', '#3B82F6'][index % 5]
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">הרשאות תקציביות</h1>
          <p className="text-muted-foreground">ניהול הרשאות תקציביות ממשלתיות ותמיכות</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowUploader(true)}
          >
            <Upload className="h-4 w-4 ml-2" />
            העלה קובץ אקסל
          </Button>
          <Button 
            className="bg-gradient-primary text-primary-foreground shadow-glow"
            onClick={() => setShowNewAuthDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            הרשאה חדשה
          </Button>
        </div>
      </div>

      {/* כרטיסי סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">סה"כ הרשאות</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">סה"כ סכום הרשאות תקציביות</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₪{new Intl.NumberFormat('he-IL').format(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* גרפים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">התפלגות לפי משרד ממשלתי מממן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-64">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ministryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={60}
                      innerRadius={25}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {ministryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300"
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900 text-sm">{data.ministry}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div>{data.count} הרשאות</div>
                                <div>₪{new Intl.NumberFormat('he-IL').format(data.amount)}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-40 border-r border-border pr-2">
                <h4 className="text-xs font-semibold text-foreground mb-2 pb-1 border-b border-border">משרדים</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {ministryData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-50 transition-colors">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-medium text-gray-900 text-xs leading-tight" 
                          style={{ wordBreak: 'break-word', lineHeight: '1.2' }}
                          title={item.ministry}
                        >
                          {item.ministry}
                        </div>
                        <div className="text-gray-500 text-xs">{item.count} הרשאות</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">התפלגות לפי מחלקה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-64">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={60}
                      innerRadius={25}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300"
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900 text-sm">{data.department}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div>{data.count} הרשאות</div>
                                <div>₪{new Intl.NumberFormat('he-IL').format(data.amount)}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 border-r border-border pr-3">
                <h4 className="text-xs font-semibold text-foreground mb-2 pb-1 border-b border-border">מחלקות</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {departmentData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate text-xs">{item.department}</div>
                        <div className="text-gray-500 text-xs">{item.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* תרשים תוקף ההרשאות */}
        <Card className="border-0 shadow-elevated bg-card overflow-hidden lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">התפלגות לפי תוקף ההרשאה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-64">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={validityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      innerRadius={25}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {validityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300 hover:drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900 text-sm">{data.category}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div>{data.count} הרשאות</div>
                                <div>₪{new Intl.NumberFormat('he-IL').format(data.amount)}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 border-r border-border pr-3">
                <h4 className="text-xs font-semibold text-foreground mb-2 pb-1 border-b border-border">תוקף</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {validityData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate text-xs">{item.category}</div>
                        <div className="text-gray-500 text-xs">{item.count} הרשאות</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ציר זמן הרשאות - גרף עמודות */}
        <Card className="border-0 shadow-elevated bg-card overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">ציר זמן הרשאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {(() => {
                const currentDate = new Date();
                
                // קיבוץ הרשאות לפי תאריך סיום תוקף (לפי חודש)
                const authsByExpiry = authorizations
                  .filter(auth => auth.valid_until)
                  .reduce((acc, auth) => {
                    const expiryDate = new Date(auth.valid_until);
                    const monthYear = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}`;
                    
                    if (!acc[monthYear]) {
                      acc[monthYear] = {
                        date: expiryDate,
                        dateLabel: new Date(expiryDate.getFullYear(), expiryDate.getMonth()).toLocaleDateString('he-IL', { 
                          month: 'short', 
                          year: 'numeric' 
                        }),
                        authorizations: [],
                        count: 0,
                        totalAmount: 0,
                        daysFromNow: Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
                      };
                    }
                    
                    acc[monthYear].authorizations.push(auth);
                    acc[monthYear].count += 1;
                    acc[monthYear].totalAmount += auth.amount || 0;
                    
                    return acc;
                  }, {});

                // המרה למערך וסידור לפי תאריך
                const timelineData = Object.values(authsByExpiry)
                  .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
                  .slice(0, 12) // הצגת 12 תקופות
                  .map((item: any) => ({
                    ...item,
                    // המרת התאריך למספר עבור ציר זמן רציף
                    dateValue: item.date.getTime(),
                    // תווית קצרה יותר לתצוגה
                    shortLabel: new Date(item.date.getFullYear(), item.date.getMonth()).toLocaleDateString('he-IL', { 
                      month: '2-digit', 
                      year: '2-digit' 
                    }).replace('.', '/'),
                    isExpired: item.daysFromNow < 0,
                    color: item.daysFromNow < 0 ? '#dc2626' : 
                           item.daysFromNow <= 90 ? '#ea580c' :
                           item.daysFromNow <= 180 ? '#ca8a04' :
                           item.daysFromNow <= 365 ? '#16a34a' : '#2563eb'
                  }));

                if (timelineData.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      אין נתונים להצגה - {authorizations.length} הרשאות נמצאו
                    </div>
                  );
                }

                console.log('Timeline data:', timelineData);

                return (
                  <div className="relative w-full h-full">
                    <div className="mb-2 text-xs text-gray-500">
                      Debug: {timelineData.length} תקופות, {authorizations.length} הרשאות כולל
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={timelineData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          type="number"
                          dataKey="dateValue"
                          scale="time"
                          domain={['dataMin', 'dataMax']}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                          height={50}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('he-IL', { 
                              month: '2-digit', 
                              year: '2-digit' 
                            }).replace('.', '/');
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                          label={{ 
                            value: 'מספר הרשאות', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#64748b', fontSize: '12px' }
                          }}
                          domain={[0, 'dataMax']}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white/97 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-200 min-w-80 max-w-96">
                                  <div className="text-center mb-3">
                                    <div className="font-bold text-slate-900 text-lg flex items-center justify-center gap-2">
                                      {data.isExpired && <span className="text-red-500">⚠️</span>}
                                      {label}
                                      {data.isExpired ? ' (פג תוקף)' : ''}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {data.isExpired ? 'פג תוקף לפני' : 'פג תוקף בעוד'} {Math.abs(data.daysFromNow)} ימים
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                                      <div className="text-2xl font-bold text-blue-600">{data.count}</div>
                                      <div className="text-xs text-gray-600">מספר הרשאות</div>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded-lg">
                                      <div className="text-lg font-bold text-green-600">
                                        ₪{new Intl.NumberFormat('he-IL', { notation: 'compact' }).format(data.totalAmount)}
                                      </div>
                                      <div className="text-xs text-gray-600">סה"כ תקציב</div>
                                    </div>
                                  </div>
                                  
                                  <div className="border-t pt-3 mb-3">
                                    <div className="text-sm font-medium text-gray-700 mb-2">רשימת הרשאות:</div>
                                    <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300">
                                      {data.authorizations.map((auth: any, i: number) => (
                                        <div key={i} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                          <div className="font-medium">• {auth.program?.substring(0, 60)}{auth.program?.length > 60 ? '...' : ''}</div>
                                          <div className="text-gray-500 mt-1">
                                            {auth.ministry} | ₪{new Intl.NumberFormat('he-IL').format(auth.amount || 0)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="border-t pt-3">
                                    <button
                                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                      onClick={() => {
                                        const today = new Date();
                                        const validUntil = new Date(data.date);
                                        const monthsDiff = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
                                        
                                        let category = '';
                                        if (monthsDiff < 0) {
                                          category = 'פג תוקף';
                                        } else if (monthsDiff <= 3) {
                                          category = 'פג תוקף עד 3 חודשים';
                                        } else if (monthsDiff <= 6) {
                                          category = 'פג תוקף עד 6 חודשים';
                                        } else if (monthsDiff <= 12) {
                                          category = 'פג תוקף עד שנה';
                                        } else {
                                          category = 'תקף למעלה משנה';
                                        }
                                        
                                        handleFilterByCategory(category);
                                      }}
                                    >
                                      הצג בטבלה
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          barSize={12}
                          radius={[2, 2, 0, 0]}
                        >
                          {timelineData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug info - נסיר אחר כך */}
      <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded mb-4">
        Debug: {authorizations.length} הרשאות כולל, {authorizations.filter(a => a.valid_until).length} עם תאריך תוקף
      </div>

      {/* טבלת הרשאות */}
      <Card className="border-0 shadow-elevated bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">רשימת הרשאות תקציביות</CardTitle>
          {filterCategory && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">מסונן לפי: {filterCategory}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilter}
                className="h-8"
              >
                נקה סינון
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable
              data={filteredAuthorizations.length > 0 ? filteredAuthorizations : authorizations}
              columns={columns}
              searchableColumnIds={["ministry", "department_slug"]}
              searchPlaceholder="חפש לפי משרד מממן או מחלקה..."
              filterableColumns={{
                ministry: {
                  label: "המשרדים",
                  options: Array.from(new Set(authorizations.map(a => a.ministry).filter(Boolean)))
                    .map(ministry => ({ label: ministry, value: ministry }))
                },
                department_slug: {
                  label: "המחלקות",
                  options: [
                    { label: 'כספים', value: 'finance' },
                    { label: 'הנדסה', value: 'engineering' },
                    { label: 'חינוך', value: 'education' },
                    { label: 'רווחה', value: 'welfare' },
                    { label: 'תרבות', value: 'non-formal' }
                  ].filter(dept => authorizations.some(a => a.department_slug === dept.value))
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      {showUploader && (
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent dir="rtl" className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>ייבוא הרשאות תקציביות מקובץ אקסל</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <DataUploader 
                context="budget_authorizations"
                onUploadSuccess={handleUploadSuccess}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                העלה קובץ אקסל עם הרשאות תקציביות. הקובץ צריך להכיל עמודות: מספר הרשאה, משרד מממן, תיאור ההרשאה, סכום ההרשאה, תוקף ההרשאה.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle>בחר תאריך אישור מליאה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>בחר תאריך</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDatePicker(false);
                    setSelectedDate(undefined);
                    setStatusUpdateId('');
                  }}
                >
                  ביטול
                </Button>
                <Button onClick={handleDateConfirm}>
                  אישור
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Authorization Dialog */}
      {showNewAuthDialog && (
        <Dialog open={showNewAuthDialog} onOpenChange={setShowNewAuthDialog}>
          <DialogContent dir="rtl" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>הוספת הרשאה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-number">מספר הרשאה *</Label>
                  <Input
                    id="auth-number"
                    value={newAuthData.authorization_number}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, authorization_number: e.target.value }))}
                    placeholder="מספר הרשאה"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministry">משרד מממן *</Label>
                  <Input
                    id="ministry"
                    value={newAuthData.ministry}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, ministry: e.target.value }))}
                    placeholder="שם המשרד"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">תיאור ההרשאה *</Label>
                <Textarea
                  id="program"
                  value={newAuthData.program}
                  onChange={(e) => setNewAuthData(prev => ({ ...prev, program: e.target.value }))}
                  placeholder="תיאור מפורט של ההרשאה"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">מס' תב"ר</Label>
                  <Input
                    id="purpose"
                    value={newAuthData.purpose}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="מספר תב&quot;ר (אופציונלי)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">סכום ההרשאה (₪) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newAuthData.amount}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid-until">תוקף ההרשאה</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={newAuthData.valid_until}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">מחלקה מטפלת</Label>
                  <Select
                    value={newAuthData.department_slug}
                    onValueChange={(value) => setNewAuthData(prev => ({ ...prev, department_slug: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מחלקה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">כספים</SelectItem>
                      <SelectItem value="engineering">הנדסה</SelectItem>
                      <SelectItem value="education">חינוך</SelectItem>
                      <SelectItem value="welfare">רווחה</SelectItem>
                      <SelectItem value="non-formal">תרבות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={newAuthData.notes}
                  onChange={(e) => setNewAuthData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות נוספות (אופציונלי)"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewAuthDialog(false);
                    setNewAuthData({
                      authorization_number: '',
                      ministry: '',
                      program: '',
                      purpose: '',
                      amount: '',
                      valid_until: '',
                      department_slug: 'finance',
                      notes: ''
                    });
                  }}
                >
                  ביטול
                </Button>
                <Button onClick={handleCreateNewAuth}>
                  שמור הרשאה
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Authorization Dialog */}
      {showEditDialog && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent dir="rtl" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>עריכת הרשאה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-auth-number">מספר הרשאה *</Label>
                  <Input
                    id="edit-auth-number"
                    value={newAuthData.authorization_number}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, authorization_number: e.target.value }))}
                    placeholder="מספר הרשאה"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ministry">משרד מממן *</Label>
                  <Input
                    id="edit-ministry"
                    value={newAuthData.ministry}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, ministry: e.target.value }))}
                    placeholder="שם המשרד"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-program">תיאור ההרשאה *</Label>
                <Textarea
                  id="edit-program"
                  value={newAuthData.program}
                  onChange={(e) => setNewAuthData(prev => ({ ...prev, program: e.target.value }))}
                  placeholder="תיאור מפורט של ההרשאה"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-purpose">מס' תב"ר</Label>
                  <Input
                    id="edit-purpose"
                    value={newAuthData.purpose}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="מספר תב&quot;ר (אופציונלי)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">סכום ההרשאה (₪) *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={newAuthData.amount}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-valid-until">תוקף ההרשאה</Label>
                  <Input
                    id="edit-valid-until"
                    type="date"
                    value={newAuthData.valid_until}
                    onChange={(e) => setNewAuthData(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">מחלקה מטפלת</Label>
                  <Select
                    value={newAuthData.department_slug}
                    onValueChange={(value) => setNewAuthData(prev => ({ ...prev, department_slug: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מחלקה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">כספים</SelectItem>
                      <SelectItem value="engineering">הנדסה</SelectItem>
                      <SelectItem value="education">חינוך</SelectItem>
                      <SelectItem value="welfare">רווחה</SelectItem>
                      <SelectItem value="non-formal">תרבות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">הערות</Label>
                <Textarea
                  id="edit-notes"
                  value={newAuthData.notes}
                  onChange={(e) => setNewAuthData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות נוספות (אופציונלי)"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingAuth(null);
                    setNewAuthData({
                      authorization_number: '',
                      ministry: '',
                      program: '',
                      purpose: '',
                      amount: '',
                      valid_until: '',
                      department_slug: 'finance',
                      notes: ''
                    });
                  }}
                >
                  ביטול
                </Button>
                <Button onClick={handleUpdateAuth}>
                  עדכן הרשאה
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}