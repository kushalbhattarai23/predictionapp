
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";
import { UploadIcon, Import, Download, Calendar, Tv } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, downloadCSV, convertToCSV } from "@/utils/csvUtils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link } from "react-router-dom";

const CSV_HEADERS = ["Show", "Episode", "Title", "Air Date"];
const EPISODES_PER_PAGE = 6;

const AdminAddShowForm: React.FC = () => {
  const { isAdmin } = useUserRoles();
  const { toast } = useToast();

  const [csvText, setCsvText] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [importedEpisodes, setImportedEpisodes] = useState<any[]>([]);
  const [importErrorRows, setImportErrorRows] = useState<{ row: number, error: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Only render if admin
  if (!isAdmin) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Show": "Agent Carter",
        "Episode": "S01E01",
        "Title": "Now is Not the End",
        "Air Date": "January 6, 2015"
      },
      {
        "Show": "Agent Carter", 
        "Episode": "S01E02",
        "Title": "Bridge and Tunnel",
        "Air Date": "January 13, 2015"
      },
      {
        "Show": "The Mandalorian",
        "Episode": "S1E1", 
        "Title": "Chapter 1: The Mandalorian",
        "Air Date": "November 12, 2019"
      }
    ];
    
    const csvContent = convertToCSV(templateData, CSV_HEADERS);
    downloadCSV(csvContent, "tv_shows_import_template");
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsvLoading(true);
    setImportedEpisodes([]);
    setImportErrorRows([]);

    let rows: any[] = [];
    try {
      rows = parseCSV(csvText);
    } catch (parseErr) {
      toast({
        title: "Failed to parse CSV.",
        description: "Check your file format.",
        variant: "destructive",
      });
      setCsvLoading(false);
      return;
    }

    // Validate headers
    const actualHeaders = Object.keys(rows[0] || {});
    const headersValid = CSV_HEADERS.every((header, idx) => (
      actualHeaders[idx]?.trim() === header
    ));
    if (!headersValid) {
      toast({
        title: "Invalid CSV headers.",
        description: `Headers must be exactly: ${CSV_HEADERS.join(", ")}`,
        variant: "destructive",
      });
      setCsvLoading(false);
      return;
    }

    let uploadedEpisodes: any[] = [];
    let errorRows: { row: number, error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const show_title = row["Show"]?.trim();
      const episode_code = row["Episode"]?.trim();
      const episode_title = row["Title"]?.trim();
      const air_date = row["Air Date"]?.trim();

      // skip if any required field is missing
      if (!show_title || !episode_code || !episode_title || !air_date) {
        errorRows.push({ row: i + 2, error: "Missing required field(s)" });
        continue;
      }

      let showId: string | null = null;
      let showSlug: string | null = null;
      try {
        // Get or insert show
        let { data: show, error: showError } = await supabase
          .from("shows")
          .select("id, slug")
          .eq("title", show_title)
          .maybeSingle();

        if (showError) throw showError;
        showId = show?.id;
        showSlug = show?.slug;
        if (!showId) {
          // Insert show
          const { data: inserted, error: insertErr } = await supabase
            .from("shows")
            .insert({ title: show_title })
            .select("id, slug")
            .single();
          if (insertErr) throw insertErr;
          showId = inserted.id;
          showSlug = inserted.slug;
        }

        // Parse episode code (e.g., S01E01, S1E1, 1x1)
        let snum = 1, epnum = 1;
        const codeMatch = episode_code.match(/^S?(\d{1,2})[Ex](\d{1,2})$/i) 
          || episode_code.match(/^(\d{1,2})x(\d{1,2})$/i);
        if (codeMatch) {
          snum = parseInt(codeMatch[1], 10);
          epnum = parseInt(codeMatch[2], 10);
        } else {
          errorRows.push({ row: i + 2, error: "Invalid episode format" });
          continue;
        }

        // Insert the episode
        const { data: episode, error: episodeErr } = await supabase
          .from("episodes")
          .insert({
            show_id: showId,
            title: episode_title,
            season_number: snum,
            episode_number: epnum,
            air_date: air_date || null,
          })
          .select("*")
          .single();

        if (episodeErr) throw episodeErr;

        uploadedEpisodes.push({
          ...episode,
          show_title,
          show_slug: showSlug,
          season_number: snum,
          episode_number: epnum
        });
      } catch (err: any) {
        errorRows.push({ row: i + 2, error: "DB error or duplicate entry" });
      }
    }

    // Show toast based on result
    if (uploadedEpisodes.length > 0) {
      toast({
        title: `Import finished. ${uploadedEpisodes.length} episode(s) uploaded.`,
        description: errorRows.length > 0
          ? `Some rows failed: ${errorRows.map(er => "Row " + er.row).join(", ")}`
          : undefined,
        variant: errorRows.length > 0 ? "destructive" : "default",
      });
      setImportedEpisodes(uploadedEpisodes);
    } else {
      toast({
        title: "No episodes uploaded.",
        description: errorRows.length > 0 ? errorRows.map(er => `Row ${er.row}: ${er.error}`).join(" / ") : "",
        variant: "destructive"
      });
      setImportedEpisodes([]);
    }

    setImportErrorRows(errorRows);
    setCsvLoading(false);
    if (uploadedEpisodes.length > 0) setCsvText("");
  };

  // Pagination logic
  const totalPages = Math.ceil(importedEpisodes.length / EPISODES_PER_PAGE);
  const startIndex = (currentPage - 1) * EPISODES_PER_PAGE;
  const endIndex = startIndex + EPISODES_PER_PAGE;
  const currentEpisodes = importedEpisodes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className="max-w-3xl mx-auto my-6 border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Import className="h-5 w-5" /> CSV Import
        </CardTitle>
        <div className="text-muted-foreground text-sm">
          Import shows and episodes from a CSV file with columns: <strong>Show, Episode, Title, Air Date</strong>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleImport} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Upload CSV File</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              disabled={csvLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Or Paste CSV Data</label>
            <Textarea
              rows={10}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={`Show,Episode,Title,Air Date
Agent Carter,S01E01,Now is Not the End,"January 6, 2015"
Agent Carter,S01E02,Bridge and Tunnel,"January 13, 2015"
`}
              className="font-mono"
              disabled={csvLoading}
            />
          </div>

          <div>
            <div className="font-semibold mb-1">Format requirements:</div>
            <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
              <li>Comma-separated values (CSV) or Tab-separated values (TSV)</li>
              <li>First row must be headers: <code>Show, Episode, Title, Air Date</code></li>
              <li>Episode format: <code>S01E01</code>, <code>S1E1</code>, or <code>1x1</code></li>
              <li>Air Date: Any standard date format (e.g., <code>January 6, 2015</code>)</li>
              <li>Fields with commas should be quoted</li>
            </ul>
          </div>

          <Button
            className={`w-full text-white hover:opacity-90 disabled:opacity-50 ${
              csvText.trim() 
                ? "bg-gray-800 hover:bg-gray-900" 
                : "bg-gray-400 hover:bg-gray-500"
            }`}
            type="submit"
            disabled={csvLoading || !csvText.trim()}
          >
            {csvLoading ? <Loader2 className="animate-spin mr-1" /> : <UploadIcon className="mr-1" />}
            {csvLoading ? "Importing..." : "Import Data"}
          </Button>
        </form>
        {importedEpisodes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-blue-700">Imported Episodes</h3>
              <div className="text-sm text-muted-foreground">
                {importedEpisodes.length} episode{importedEpisodes.length !== 1 ? 's' : ''} imported
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentEpisodes.map((episode, idx) => (
                <Card key={episode.id || idx} className="hover:shadow-lg transition-shadow border-blue-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-blue-600 line-clamp-2">
                        {episode.title}
                      </CardTitle>
                      <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        S{episode.season_number}E{episode.episode_number}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-blue-500" />
                      <Link 
                        to={`/tv-shows/show/${episode.show_slug}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm"
                      >
                        {episode.show_title}
                      </Link>
                    </div>
                    
                    {episode.air_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(episode.air_date).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
        {(importErrorRows.length > 0 && importedEpisodes.length > 0) && (
          <div className="mt-4 text-sm text-red-500">
            <b>Some rows failed:</b> {importErrorRows.map(er => `Row ${er.row}: ${er.error}`).join("; ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAddShowForm;
