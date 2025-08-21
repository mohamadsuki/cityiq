import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Target, ListChecks, BarChart3, CheckCircle, X, CalendarIcon, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DepartmentSlug } from "@/lib/demoAccess";

// Project row type aligned with DB
export type ProjectStatus = string; // free text in DB
export type ProjectDomain = string; // free text in DB (e.g., "מבני ציבור", "תשתיות", "חינוך")

type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  department_slug: DepartmentSlug | null;
  code: string | null;
  name: string | null;
  department: string | null; // optional free text in DB
  domain: ProjectDomain | null;
  funding_source: string | null;
  status: ProjectStatus | null;
  budget_approved: number | null;
  budget_executed: number | null;
  progress: number | null; // 0-100
  notes: string | null;
  image_urls: string[] | null; // storage paths or data URLs in demo
  file_urls: string[] | null; // PDF files
  start_at: string | null; // start date
  end_at: string | null; // end date
  tabar_assignment: string | null; // שיוך לתב"ר
};

const DEPARTMENT_LABELS: Record<DepartmentSlug, string> = {
  finance: "כספים",
  education: "חינוך",
  engineering: "הנדסה",
  welfare: "רווחה",
  "non-formal": "חינוך בלתי פורמלי",
  business: "עסקים",
  "city-improvement": "מחלקת שיפור פני העיר",
  enforcement: "אכיפה",
  ceo: "מנכ\"ל",
};

const ALL_DEPARTMENTS: DepartmentSlug[] = [
  "finance",
  "education",
  "engineering",
  "welfare",
  "non-formal",
  "business",
  "city-improvement",
  "enforcement",
];

const FUNDING_SOURCES = [
  "הגנת סביבה",
  "מפעל הפיס", 
  "משרד חינוך",
  "משרד בינוי ושיכון",
  "הלוואה",
  "משרד פנים",
  "משרד הכלכלה",
  "רמ\"י",
  "משרד הנגב, הגליל והחוסן הלאומי",
  "משרד הדיגיטל הלאומי",
  "משרד להגנת הסביבה",
  "משרד התרבות",
  "משרד המדע והטכנולוגיה",
  "מנהל תכנון",
  "משרד תחבורה",
  "משרד בריאות",
  "עירייה",
  "משרד האנרגיה",
  "משרד החקלאות"
];

export default function ProjectsApp() {
  const { role, departments, user, session } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  
  const canCreate = role === "mayor" || role === "ceo" || role === "manager";
  const canDelete = role === "mayor" || role === "ceo";

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Project | null>(null);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [resolvedFiles, setResolvedFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editing, setEditing] = useState<Project | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState<"all" | DepartmentSlug>(
    (searchParams.get("department") as DepartmentSlug) || "all"
  );
  const [status, setStatus] = useState<string>("all");
  const [domain, setDomain] = useState<string>("all");
  const [showDepartmentChart, setShowDepartmentChart] = useState(false);

  // Handle filtering from "What's New" section
  const filter = searchParams.get("filter");
  const period = searchParams.get("period");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const visibleDepartments: DepartmentSlug[] = (role === "mayor" || role === "ceo") ? ALL_DEPARTMENTS : departments;

  const [files, setFiles] = useState<File[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

const [form, setForm] = useState<Partial<Project>>({
  name: "",
  code: "",
  department_slug: (department !== "all" ? department : (visibleDepartments?.[0] ?? "finance")) as DepartmentSlug,
  domain: "",
  status: "תכנון",
  funding_source: "",
  budget_approved: null,
  budget_executed: null,
  progress: 0,
  notes: "",
  image_urls: [],
  file_urls: [],
  start_at: null,
  end_at: null,
  tabar_assignment: "",
});

  useEffect(() => {
    if (department === "all") {
      searchParams.delete("department");
    } else {
      searchParams.set("department", department);
    }
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  // Navigation functions for lightbox
  const openLightbox = (index: number) => {
    if (resolvedImages.length === 0) return;
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % resolvedImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length);
  };

  const downloadImage = () => {
    const imageUrl = resolvedImages[selectedImageIndex];
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `project-image-${selectedImageIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      switch (e.key) {
        case 'Escape':
          setLightboxOpen(false);
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  async function fetchProjects() {
    setLoading(true);
    
    let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
    
    // Filter by department if specific department is selected
    if (department !== "all") {
      query = query.eq("department_slug", department);
    } else if (role !== "mayor" && role !== "ceo") {
      // For managers, filter to only show projects from their departments
      query = query.in("department_slug", visibleDepartments);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Failed to load projects", error);
      toast({ title: "שגיאה בטעינת פרויקטים", description: error.message, variant: "destructive" });
      setProjects([]);
    } else {
      setProjects((data || []) as Project[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      // Filter by user's visible departments (additional client-side check)
      if (role !== "mayor" && role !== "ceo" && p.department_slug && !visibleDepartments.includes(p.department_slug)) {
        return false;
      }
      
      if (q && !(`${p.name ?? ""} ${p.code ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (department !== "all" && p.department_slug !== department) return false;
      if (status !== "all") {
        if (status === "delayed") {
          // Special case for delayed projects - show both "תקוע" and "עיכוב" statuses
          const projectStatus = (p.status ?? "").toLowerCase();
          if (projectStatus !== "תקוע" && projectStatus !== "עיכוב") return false;
        } else {
          // Normal status filtering
          if ((p.status ?? "").toLowerCase() !== status.toLowerCase()) return false;
        }
      }
      if (domain !== "all" && (p.domain ?? "").toLowerCase() !== domain.toLowerCase()) return false;
      
      // Apply filter from "What's New" section
      if (filter && period) {
        const now = new Date();
        let from: Date, to: Date;
        
        if (period === 'custom' && fromParam && toParam) {
          from = new Date(fromParam);
          to = new Date(toParam);
        } else {
          // Calculate date range based on period
          to = now;
          switch (period) {
            case 'week':
              from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default: // day
              from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }
        }
        
        if (filter === 'new') {
          // Show projects created in the time range
          const createdAt = new Date(p.created_at);
          if (createdAt < from || createdAt > to) return false;
        } else if (filter === 'updated') {
          // Show projects updated in the time range (excluding newly created ones)
          const updatedAt = new Date(p.updated_at);
          const createdAt = new Date(p.created_at);
          if (updatedAt < from || updatedAt > to || updatedAt.getTime() === createdAt.getTime()) return false;
        }
      }
      
      return true;
    });
  }, [projects, q, department, status, domain, filter, period, fromParam, toParam]);

  // Calculate KPI data
  const kpiData = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Count stuck projects - status "תקוע"
    const stuckProjects = projects.filter(p => 
      (p.status ?? '').toLowerCase() === 'תקוע' || 
      (p.status ?? '').toLowerCase() === 'עיכוב'
    );
    
    const activeProjects = projects.filter(p => 
      p.status === 'ביצוע'
    );
    
    const planningProjects = projects.filter(p => 
      p.status === 'תכנון'
    );
    
    const departmentBudgets = ALL_DEPARTMENTS.reduce((acc, dept) => {
      const deptProjects = projects.filter(p => p.department_slug === dept);
      const totalBudget = deptProjects.reduce((sum, p) => sum + (p.budget_approved ?? 0), 0);
      acc[dept] = { count: deptProjects.length, budget: totalBudget };
      return acc;
    }, {} as Record<DepartmentSlug, { count: number; budget: number }>);
    
    const totalBudget = Object.values(departmentBudgets).reduce((sum, dept) => sum + dept.budget, 0);
    
    // Get top 3 departments by project count or budget for display
    const topDepartments = ALL_DEPARTMENTS
      .filter(dept => departmentBudgets[dept]?.count > 0)
      .sort((a, b) => {
        const aBudget = departmentBudgets[a]?.budget || 0;
        const bBudget = departmentBudgets[b]?.budget || 0;
        const aCount = departmentBudgets[a]?.count || 0;
        const bCount = departmentBudgets[b]?.count || 0;
        // Sort by budget first, then by count
        if (aBudget !== bBudget) return bBudget - aBudget;
        return bCount - aCount;
      })
      .slice(0, 3);
    
    // Debug log to check department calculations
    console.log('Department budgets:', departmentBudgets);
    console.log('All projects:', projects.map(p => ({ name: p.name, dept: p.department_slug, budget: p.budget_approved })));
    
    return {
      delayed: stuckProjects.length,
      activeAndPlanning: activeProjects.length + planningProjects.length,
      activeCount: activeProjects.length,
      planningCount: planningProjects.length,
      totalActive: projects.filter(p => p.status === 'ביצוע' || p.status === 'תכנון').length,
      totalBudget,
      departmentBudgets,
      topDepartments
    };
  }, [projects]);

  // Function to handle KPI card clicks
  const handleKpiClick = (filterType: string) => {
    switch (filterType) {
      case 'delayed':
        // Filter for delayed projects - status "עיכוב" or "תקוע"
        setQ('');
        setStatus('delayed'); // Special status to handle both עיכוב and תקוע
        setDomain('all');
        break;
      case 'active':
        setQ('');
        setStatus('ביצוע');
        setDomain('all');
        break;
      case 'planning':
        setQ('');
        setStatus('תכנון');
        setDomain('all');
        break;
      case 'departments':
        setShowDepartmentChart(true);
        break;
      case 'all-active':
        setQ('');
        setStatus('all');
        setDomain('all');
        break;
    }
  };

  // Prepare data for pie chart
  const departmentChartData = useMemo(() => {
    return ALL_DEPARTMENTS
      .map(dept => ({
        name: DEPARTMENT_LABELS[dept],
        value: kpiData.departmentBudgets[dept]?.budget || 0,
        count: kpiData.departmentBudgets[dept]?.count || 0
      }))
      .filter(item => item.count > 0); // Filter by project count instead of budget value
  }, [kpiData.departmentBudgets]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function openCreate() {
  setEditing(null);
  setForm({
    name: "",
    code: "",
    department_slug: (department !== "all" ? department : (visibleDepartments?.[0] ?? "finance")) as DepartmentSlug,
    domain: "",
    status: "תכנון",
    funding_source: "",
    budget_approved: null,
    budget_executed: null,
    progress: 0,
    notes: "",
    image_urls: [],
    file_urls: [],
    start_at: null,
    end_at: null,
    tabar_assignment: "",
  });
  setFiles([]);
  setPdfFiles([]);
  setOpen(true);
}

function openEdit(p: Project) {
  setEditing(p);
  setForm({ ...p });
  setFiles([]);
  setPdfFiles([]);
  setOpen(true);
}

  function openView(p: Project) {
    setViewing(p);
    setResolvedImages([]);
    setResolvedFiles([]);
    setViewOpen(true);
    
    const imagePaths = p.image_urls || [];
    const filePaths = p.file_urls || [];
    
    // Load images
    if (imagePaths.length > 0) {
      Promise.all(imagePaths.map(async (path) => {
        const { data, error } = await supabase.storage.from('uploads').createSignedUrl(path, 3600);
        if (error) return null;
        return data?.signedUrl || null;
      })).then((urls) => setResolvedImages(urls.filter(Boolean) as string[]));
    }
    
    // Load files
    if (filePaths.length > 0) {
      Promise.all(filePaths.map(async (path) => {
        const { data, error } = await supabase.storage.from('uploads').createSignedUrl(path, 3600);
        if (error) return null;
        return {
          url: data?.signedUrl || '',
          name: path.split('/').pop() || 'קובץ לא ידוע'
        };
      })).then((files) => setResolvedFiles(files.filter(f => f.url) as Array<{ url: string; name: string }>));
    }
  }

  async function saveProject() {
  if (!form.name || !form.department_slug) {
    toast({ title: "שדות חסרים", description: "שם ומחלקה הינם שדות חובה", variant: "destructive" });
    return;
  }

  if (!user?.id) {
    toast({ title: "נדרש להתחבר", description: "יש להתחבר כדי לבצע פעולה זו", variant: "destructive" });
    return;
  }

  const basePayload: any = {
    department_slug: form.department_slug,
    code: form.code ?? null,
    name: form.name ?? null,
    domain: form.domain ?? null,
    status: form.status ?? null,
    funding_source: form.funding_source ?? null,
    budget_approved: form.budget_approved ?? null,
    budget_executed: form.budget_executed ?? null,
    progress: form.progress ?? null,
    notes: form.notes ?? null,
    start_at: form.start_at,
    end_at: form.end_at,
    tabar_assignment: form.tabar_assignment ?? null,
  };

  if (editing) {
    // Upload any new images for existing project
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const path = `projects/${editing.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (upErr) {
        console.error('Upload failed', upErr);
      } else {
        uploadedPaths.push(path);
      }
    }


    // Upload PDF files
    const uploadedPdfPaths: string[] = [];
    for (const file of pdfFiles) {
      const path = `projects/${editing.id}/pdf_${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (upErr) {
        console.error('PDF Upload failed', upErr);
      } else {
        uploadedPdfPaths.push(path);
      }
    }

    const combinedImages = [ ...(editing.image_urls || []), ...uploadedPaths ];
    const combinedPdfs = [ ...(editing.file_urls || []), ...uploadedPdfPaths ];
    const resp = await supabase.from("projects").update({ 
      ...basePayload, 
      image_urls: combinedImages,
      file_urls: combinedPdfs
    }).eq("id", editing.id);
    const error = resp.error as any;
    if (error) {
      console.error("Failed to save project", error);
      toast({ title: "שמירת פרויקט נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הצלחה", description: "הפרויקט נשמר בהצלחה" });
      setFiles([]);
      setPdfFiles([]);
      setOpen(false);
      fetchProjects();
    }
  } else {
    // Create project first to get ID
    const createResp = await supabase.from("projects").insert([{ ...basePayload, user_id: user.id }]).select().single();
    if (createResp.error) {
      console.error("Failed to create project", createResp.error);
      toast({ title: "שמירת פרויקט נכשלה", description: createResp.error.message, variant: "destructive" });
      return;
    }
    const created = createResp.data as Project;

    // Upload images if any
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const path = `projects/${created.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (upErr) {
        console.error('Upload failed', upErr);
      } else {
        uploadedPaths.push(path);
      }
    }


    // Upload PDF files
    const uploadedPdfPaths: string[] = [];
    for (const file of pdfFiles) {
      const path = `projects/${created.id}/pdf_${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (upErr) {
        console.error('PDF Upload failed', upErr);
      } else {
        uploadedPdfPaths.push(path);
      }
    }

    if (uploadedPaths.length > 0 || uploadedPdfPaths.length > 0) {
      const updResp = await supabase.from("projects").update({ 
        image_urls: uploadedPaths.length > 0 ? uploadedPaths : null,
        file_urls: uploadedPdfPaths.length > 0 ? uploadedPdfPaths : null
      }).eq("id", created.id);
      if (updResp.error) {
        console.error("Failed to attach images", updResp.error);
        toast({ title: "שגיאה בהעלאת קבצים", description: updResp.error.message, variant: "destructive" });
      }
    }
    toast({ title: "הצלחה", description: "הפרויקט נשמר בהצלחה" });
    setFiles([]);
    setPdfFiles([]);
    setOpen(false);
    fetchProjects();
  }
}

  async function deleteProject(p: Project) {
    if (!canDelete) return;
    if (!confirm("למחוק פרויקט זה?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) {
      toast({ title: "מחיקה נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "נמחק", description: "הפרויקט נמחק" });
      fetchProjects();
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פרויקטים</h1>
          <p className="text-sm text-muted-foreground">ניהול פרויקטים עירוניים לפי מחלקות</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>פרויקט חדש</Button>
        )}
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card 
          className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleKpiClick('delayed')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-red-700">{kpiData.delayed}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-red-800">פרויקטים בעיכוב</div>
              <div className="text-sm text-red-600">פרויקטים בסטטוס תקוע או עיכוב</div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleKpiClick('active')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ListChecks className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold text-blue-700">{kpiData.activeAndPlanning}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-blue-800">פרויקטים בביצוע ותכנון</div>
              <div className="text-sm text-blue-600">{kpiData.activeCount} בביצוע, {kpiData.planningCount} בתכנון</div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleKpiClick('departments')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-green-700">₪{(kpiData.totalBudget / 1000000).toFixed(0)}M</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-green-800">התפלגות לפי מחלקות</div>
              <div className="text-sm text-green-600">
                {kpiData.topDepartments.length > 0 ? (
                  kpiData.topDepartments.map(dept => 
                    `${DEPARTMENT_LABELS[dept]}: ₪${(kpiData.departmentBudgets[dept]?.budget / 1000000 || 0).toFixed(1)}M`
                  ).join(', ')
                ) : (
                  'לא נמצאו פרויקטים עם תקציב'
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleKpiClick('all-active')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="text-3xl font-bold text-purple-700">{kpiData.totalActive}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-purple-800">סה״כ פרויקטים פעילים</div>
              <div className="text-sm text-purple-600">פרויקטים פעילים בכל המחלקות</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution Chart Modal */}
      {showDepartmentChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDepartmentChart(false)}>
          <div className="bg-background p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">התפלגות תקציבים לפי מחלקות</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDepartmentChart(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {departmentChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, value}) => `${name}: ₪${(value / 1000000).toFixed(1)}M`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`₪${(value / 1000000).toFixed(1)}M`, 'תקציב']}
                      labelFormatter={(label) => label}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                אין נתונים להציג
              </div>
            )}
          </div>
        </div>
      )}

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="q">חיפוש</Label>
            <Input id="q" placeholder="חיפוש לפי שם/קוד" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label>מחלקה</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as any)}>
              <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                {visibleDepartments.map((d) => (
                  <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>סטטוס</Label>
<Select value={status} onValueChange={(v) => setStatus(v)}>
  <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
  <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
     <SelectItem value="all">הכל</SelectItem>
     <SelectItem value="תכנון">תכנון</SelectItem>
     <SelectItem value="ביצוע">ביצוע</SelectItem>
     <SelectItem value="סיום">סיום</SelectItem>
     <SelectItem value="תקוע">תקוע</SelectItem>
     <SelectItem value="עיכוב">עיכוב</SelectItem>
  </SelectContent>
</Select>
          </div>
          <div>
            <Label>תחום</Label>
            <Select value={domain} onValueChange={(v) => setDomain(v)}>
              <SelectTrigger><SelectValue placeholder="תחום" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="מבני ציבור">מבני ציבור</SelectItem>
                <SelectItem value="תשתיות">תשתיות</SelectItem>
                <SelectItem value="חינוך">חינוך</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-2">שם</th>
              <th className="py-2">קוד</th>
              <th className="py-2">מחלקה</th>
              <th className="py-2">תחום</th>
              <th className="py-2">סטטוס</th>
              <th className="py-2">תקציב מאושר</th>
              <th className="py-2">תקציב מבוצע</th>
              <th className="py-2">התקדמות</th>
              <th className="py-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="py-6" colSpan={9}>טוען…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="py-6" colSpan={9}>לא נמצאו פרויקטים</td></tr>
            )}
            {!loading && filtered.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-3 font-medium">{p.name || "—"}</td>
                <td className="py-3">{p.code || "—"}</td>
                <td className="py-3">{p.department_slug ? DEPARTMENT_LABELS[p.department_slug] : "—"}</td>
                <td className="py-3">{p.domain || "—"}</td>
                <td className="py-3">
                  {p.status ? <Badge>{p.status}</Badge> : "—"}
                </td>
                <td className="py-3">{p.budget_approved != null ? `₪${Number(p.budget_approved).toLocaleString()}` : "—"}</td>
                <td className="py-3">{p.budget_executed != null ? `₪${Number(p.budget_executed).toLocaleString()}` : "—"}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24"><Progress value={p.progress ?? 0} /></div>
                    <span className="text-sm text-muted-foreground">{p.progress ?? 0}%</span>
                  </div>
                </td>
                <td className="py-3 space-x-2 space-x-reverse">
                  <Button variant="secondary" size="sm" onClick={() => openView(p)}>צפייה</Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>עריכה</Button>
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => deleteProject(p)}>מחיקה</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרטי פרויקט</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>שם</Label>
                  <div>{viewing.name || "—"}</div>
                </div>
                <div>
                  <Label>קוד</Label>
                  <div>{viewing.code || "—"}</div>
                </div>
                <div>
                  <Label>מחלקה</Label>
                  <div>{viewing.department_slug ? DEPARTMENT_LABELS[viewing.department_slug] : "—"}</div>
                </div>
                <div>
                  <Label>סטטוס</Label>
                  <div>{viewing.status || "—"}</div>
                </div>
                <div>
                  <Label>שיוך לתב"ר</Label>
                  <div>{viewing.tabar_assignment || "—"}</div>
                </div>
                <div>
                  <Label>תחום</Label>
                  <div>{viewing.domain || "—"}</div>
                </div>
                <div>
                  <Label>מקור מימון</Label>
                  <div>{viewing.funding_source || "—"}</div>
                </div>
                <div>
                  <Label>תקציב מאושר</Label>
                  <div>{viewing.budget_approved != null ? `₪${Number(viewing.budget_approved).toLocaleString()}` : "—"}</div>
                </div>
                <div>
                  <Label>תקציב מבוצע</Label>
                  <div>{viewing.budget_executed != null ? `₪${Number(viewing.budget_executed).toLocaleString()}` : "—"}</div>
                </div>
                <div className="md:col-span-2">
                  <Label>תיאור</Label>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{viewing.notes || "—"}</div>
                </div>
              </div>
              <div>
                <Label>תמונות</Label>
                {resolvedImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {resolvedImages.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(idx)}
                      >
                        <img 
                          src={url} 
                          alt={`תמונה לפרויקט ${viewing.name || ""}`} 
                          className="w-full h-40 object-cover rounded-md border border-border" 
                          loading="lazy" 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">אין תמונות</div>
                )}
              </div>
              
              <div>
                <Label>קבצים</Label>
                {resolvedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {resolvedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
                        <div className="text-sm font-medium">{file.name}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="gap-1"
                        >
                          <Download className="h-4 w-4" />
                          הורדה
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">אין קבצים</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת פרויקט" : "פרויקט חדש"}</DialogTitle>
            <DialogDescription className="sr-only">טופס יצירה/עריכת פרויקט</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>שם הפרויקט</Label>
              <Input value={(form.name as string) || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>


            <div>
              <Label>מחלקה</Label>
              <Select value={(form.department_slug as DepartmentSlug) ?? "finance"} onValueChange={(v) => setForm((f) => ({ ...f, department_slug: v as DepartmentSlug }))}>
                <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {visibleDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>שיוך לתב"ר</Label>
              <Input value={(form.tabar_assignment as string) || ""} onChange={(e) => setForm((f) => ({ ...f, tabar_assignment: e.target.value }))} placeholder="מספר תב״ר" />
            </div>

            <div>
              <Label>תחום</Label>
              <Input value={(form.domain as string) || ""} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} placeholder="לדוגמה: מבני ציבור / תשתיות / חינוך" />
            </div>

<div>
  <Label>סטטוס</Label>
  <Select value={(form.status as string) || "תכנון"} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
    <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
    <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
      <SelectItem value="תכנון">תכנון</SelectItem>
      <SelectItem value="ביצוע">ביצוע</SelectItem>
      <SelectItem value="סיום">סיום</SelectItem>
      <SelectItem value="תקוע">תקוע</SelectItem>
    </SelectContent>
  </Select>
</div>

<div>
  <Label>מקור מימון</Label>
  <Select 
    value={(form.funding_source as string) || ""} 
    onValueChange={(v) => {
      const currentSources = (form.funding_source as string)?.split(', ') || [];
      const newSources = currentSources.includes(v) 
        ? currentSources.filter(s => s !== v)
        : [...currentSources, v];
      setForm((f) => ({ ...f, funding_source: newSources.join(', ') }));
    }}
  >
    <SelectTrigger><SelectValue placeholder="בחר מקורות מימון" /></SelectTrigger>
    <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
      {FUNDING_SOURCES.map((source) => (
        <SelectItem key={source} value={source}>{source}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  {form.funding_source && (
    <div className="mt-2 text-sm text-muted-foreground">
      נבחרו: {form.funding_source}
    </div>
  )}
</div>

<div className="md:col-span-2">
  <Label>תיאור</Label>
  <Textarea value={(form.notes as string) || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="הוספת תיאור על הפרויקט" />
</div>

            <div>
              <Label>תקציב מאושר (₪)</Label>
              <Input type="number" value={(form.budget_approved as number | null) ?? ""} onChange={(e) => setForm((f) => ({ ...f, budget_approved: e.target.value ? Number(e.target.value) : null }))} />
            </div>

            <div>
              <Label>תקציב מבוצע (₪)</Label>
              <Input type="number" value={(form.budget_executed as number | null) ?? ""} onChange={(e) => setForm((f) => ({ ...f, budget_executed: e.target.value ? Number(e.target.value) : null }))} />
            </div>

<div>
  <Label>התקדמות</Label>
  <div className="space-y-2">
    <div className="flex gap-2">
      {[25, 50, 75, 100].map((value) => (
        <Button
          key={value}
          type="button"
          variant={((form.progress as number) || 0) === value ? "default" : "outline"}
          size="sm"
          onClick={() => setForm((f) => ({ ...f, progress: value }))}
          className="flex-1"
        >
          {value}%
        </Button>
      ))}
    </div>
    <Progress value={(form.progress as number) || 0} className="w-full" />
  </div>
</div>

<div>
  <Label>תאריך התחלה</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant={"outline"}
        className={cn(
          "w-full justify-start text-left font-normal",
          !form.start_at && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {form.start_at ? format(new Date(form.start_at), "dd/MM/yyyy") : <span>בחר תאריך התחלה</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={form.start_at ? new Date(form.start_at) : undefined}
        onSelect={(date) => setForm((f) => ({ ...f, start_at: date?.toISOString() || null }))}
        initialFocus
        className={cn("p-3 pointer-events-auto")}
      />
    </PopoverContent>
  </Popover>
</div>

<div>
  <Label>תאריך סיום</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant={"outline"}
        className={cn(
          "w-full justify-start text-left font-normal",
          !form.end_at && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {form.end_at ? format(new Date(form.end_at), "dd/MM/yyyy") : <span>בחר תאריך סיום</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={form.end_at ? new Date(form.end_at) : undefined}
        onSelect={(date) => setForm((f) => ({ ...f, end_at: date?.toISOString() || null }))}
        initialFocus
        className={cn("p-3 pointer-events-auto")}
      />
    </PopoverContent>
  </Popover>
</div>

<div className="md:col-span-2">
  <Label>תמונות פרויקט</Label>
  <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
  <p className="text-xs text-muted-foreground mt-1">
    נבחרו {files.length} קבצים. {editing?.image_urls?.length ? `(${editing.image_urls.length} תמונות קיימות)` : ""}
  </p>
</div>

<div className="md:col-span-2">
  <Label>קבצי PDF</Label>
  <Input type="file" accept=".pdf" multiple onChange={(e) => setPdfFiles(Array.from(e.target.files || []))} />
  <p className="text-xs text-muted-foreground mt-1">
    נבחרו {pdfFiles.length} קבצי PDF. {editing?.file_urls?.length ? `(${editing.file_urls.length} קבצים קיימים)` : ""}
  </p>
</div>
</div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={saveProject}>{editing ? "שמירה" : "יצירה"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 bg-black/30 rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadImage}
              className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 bg-black/30 rounded-full gap-2 p-2"
            >
              <Download className="h-5 w-5" />
              הורדה
            </Button>

            {/* Previous Button */}
            {resolvedImages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 bg-black/30 rounded-full p-3"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Next Button */}
            {resolvedImages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 bg-black/30 rounded-full p-3"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            <img
              src={resolvedImages[selectedImageIndex]}
              alt={`תמונה ${selectedImageIndex + 1} של פרויקט ${viewing?.name || ""}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Counter */}
            {resolvedImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {selectedImageIndex + 1} מתוך {resolvedImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
