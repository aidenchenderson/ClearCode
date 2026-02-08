import { useState } from "react";
import { AssignmentProgress } from "@/components/AssignmentProgress";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { mockProgressByAssignmentId } from "@/data/mockData";

/**
 * Demo page showcasing the AssignmentProgress component with mock data.
 * This demonstrates how progress tracking works for both group and individual assignments.
 */
const ProgressDemo = () => {
  const [progressSearch, setProgressSearch] = useState("");

  return (
    <div className="min-h-screen flex flex-col gradient-bg relative overflow-hidden">
      <TopBar />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8 relative z-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Progress Tracking Demo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Real-time visualization of student coding activity across assignments
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>How Progress Tracking Works</CardTitle>
              <CardDescription>
                The system tracks real-time coding activity from student repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Sessions are auto-detected</p>
                  <p className="text-sm text-muted-foreground">
                    When students code, the VS Code extension tracks changes and groups them into sessions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0">2</Badge>
                <div>
                  <p className="font-medium">Granular timeline entries</p>
                  <p className="text-sm text-muted-foreground">
                    Each session contains timestamped entries showing lines of code changed and AI usage
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0">3</Badge>
                <div>
                  <p className="font-medium">Group attribution</p>
                  <p className="text-sm text-muted-foreground">
                    For group assignments, each session and entry is attributed to specific team members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="group" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="group">Group Assignment (a1)</TabsTrigger>
            <TabsTrigger value="individual">Individual Assignment (a2)</TabsTrigger>
            <TabsTrigger value="demo">Demo Data</TabsTrigger>
          </TabsList>

          <TabsContent value="group" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>REST API Design - Group Assignment</CardTitle>
                <CardDescription>
                  Shows progress for multiple groups working on the same assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Data Structure:</p>
                  <pre className="text-xs overflow-x-auto">
{`Groups:
  - Group Alpha (@alice-dev, @bob-codes, @charlie-git)
    • 3 sessions with mixed AI usage
    • Sessions attributed to individual members
  - Group Beta (@diana-py, @eve-ml)
    • 2 sessions, one with heavy AI usage`}
                  </pre>
                </div>
                <AssignmentProgress
                  assignmentId="a1"
                  isGroup={true}
                  search={progressSearch}
                  onSearchChange={setProgressSearch}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Analysis Report - Solo Assignment</CardTitle>
                <CardDescription>
                  Individual students working on separate repositories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Data Structure:</p>
                  <pre className="text-xs overflow-x-auto">
{`Students:
  - alice-dev: 1 session, no AI
  - bob-codes: 2 sessions, one with AI`}
                  </pre>
                </div>
                <AssignmentProgress
                  assignmentId="a2"
                  isGroup={false}
                  search={progressSearch}
                  onSearchChange={setProgressSearch}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demo/Fallback Data</CardTitle>
                <CardDescription>
                  Default data shown for new assignments without real progress yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-amber-800">Note:</p>
                  <p className="text-xs text-amber-700">
                    This demo data is automatically shown for any assignment that doesn't have
                    real progress data yet. It includes sample users: kristiandiana, iainmac32, and aidenchenderson.
                  </p>
                </div>
                <AssignmentProgress
                  assignmentId="demo"
                  isGroup={false}
                  search={progressSearch}
                  onSearchChange={setProgressSearch}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Code Reference</CardTitle>
            <CardDescription>
              How to use mockProgressByAssignmentId in your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`// Import the data
import { mockProgressByAssignmentId } from "@/data/mockData";

// Get progress for a specific assignment (returns ProgressSection[])
const sections = mockProgressByAssignmentId["a1"];

// Fallback to demo data if assignment has no progress yet
const sections = mockProgressByAssignmentId[assignmentId] ?? mockProgressByAssignmentId["demo"];

// Each section contains:
{
  id: "group-id",           // Identifier (group ID or username)
  label: "Group Alpha",     // Display name
  repoLink?: "https://...", // Optional GitHub repo
  members?: ["user1"],      // For groups: member usernames
  sessions: [               // Array of coding sessions
    {
      id: "session-id",
      startTime: "ISO timestamp",
      endTime: "ISO timestamp",
      locChanged: 120,      // Total LOC in session
      aiUsed: false,        // Whether AI was used
      githubUsernames?: ["user1"], // Who worked in this session
      details: [            // Granular timeline entries
        {
          timestamp: "ISO",
          locChanged: 45,
          aiUsed: false,
          githubUsername?: "user1"
        }
      ]
    }
  ]
}`}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProgressDemo;
