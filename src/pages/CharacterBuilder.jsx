import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Swords, Sparkles, Shield, User, Flame, Trophy, ChevronRight } from "lucide-react";

const archetypes = ["Powerhouse", "Technician", "High Flyer", "Striker", "Hybrid"];
const alignments = ["Face", "Heel", "Tweener"];
const traits = [
  "Aggressive", "Calculated", "Flashy", "Ruthless", "Underdog",
  "Explosive", "Arrogant", "Relentless", "Smooth", "Sadistic", "Disciplined", "Showman",
];
const objectives = [
  "Wear opponent down", "Out-speed them", "Overpower them",
  "Out-wrestle them", "Trick / cheat them", "Punish a body part",
];

const sectionIcons = {
  identity: User,
  objective: Shield,
  moveset: Swords,
  psychology: Flame,
  expression: Sparkles,
  special: Trophy,
};

const initialState = {
  ringName: "", realName: "", alignment: "", archetype: "", hometown: "",
  billedHeight: "", billedWeight: "", traits: [], objective: "", objectiveNotes: "",
  openingStrategy: "", heatPlan: "", comebackStyle: "", finishLogic: "",
  entranceStyle: "", mannerisms: "", crowdInteraction: "",
  taunt1: "", taunt2: "", taunt3: "",
  moveSet: {
    standingStrike: "", standingBigStrike: "", standingHold: "", standingMove: "",
    runningStrike: "", runningMove: "",
    groundStrike: "", runningGroundStrike: "", groundHold: "", groundMove: "",
    cornerMove: "", downedCornerMove: "", runningCornerMove: "",
    ropeMove: "", ropeReboundYou: "", ropeReboundThem: "",
    comeback: "", signature: "", finisher: "", finisherType: "", finisherProtected: "",
    signatureSetup: "", comebackEmotion: "",
  },
};

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-zinc-200">{label}</label>
        {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function TogglePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-sm transition ${
        active
          ? "border-fuchsia-400 bg-fuchsia-500/20 text-white shadow"
          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

export default function CharacterBuilder() {
  const [form, setForm] = useState(initialState);
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "identity";
  const [tab, setTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [sheetId, setSheetId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Load existing draft
      base44.entities.CharacterSheet.filter({ trainee_id: u.id }).then(res => {
        const arr = Array.isArray(res) ? res : (res?.items || []);
        if (arr.length > 0) {
          const sheet = arr[0];
          setSheetId(sheet.id);
          if (sheet.form_data) setForm({
              ...initialState,
              ...sheet.form_data,
              moveSet: { ...initialState.moveSet, ...(sheet.form_data.moveSet || {}) },
              traits: sheet.form_data.traits || [],
            });
        }
      });
    }).catch(() => {});
  }, []);

  const saveSheet = async (submit = false) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      trainee_id: user.id,
      trainee_name: user.full_name || user.email,
      form_data: form,
      status: submit ? "submitted" : "draft",
      ...(submit ? { submitted_at: new Date().toISOString() } : {}),
    };
    if (sheetId) {
      await base44.entities.CharacterSheet.update(sheetId, payload);
    } else {
      const created = await base44.entities.CharacterSheet.create(payload);
      setSheetId(created.id);
    }
    setSaving(false);
    toast.success(submit ? "Submitted for coach review!" : "Draft saved!");
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateMove = (key, value) =>
    setForm((prev) => ({ ...prev, moveSet: { ...prev.moveSet, [key]: value } }));

  const toggleTrait = (trait) => {
    setForm((prev) => {
      const exists = prev.traits.includes(trait);
      const next = exists
        ? prev.traits.filter((t) => t !== trait)
        : prev.traits.length < 3 ? [...prev.traits, trait] : prev.traits;
      return { ...prev, traits: next };
    });
  };

  const completion = useMemo(() => {
    const ms = form.moveSet || {};
    const checks = [
      form.ringName, form.alignment, form.archetype, (form.traits || []).length === 3,
      form.objective, ms.standingStrike, ms.standingMove,
      ms.signature, ms.finisher, form.openingStrategy,
      form.finishLogic, form.entranceStyle,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [form]);

  const nextRecommendations = useMemo(() => {
    const items = [];
    const ms = form.moveSet || {};
    if (!form.ringName) items.push("Choose a ring name before adding advanced move logic.");
    if (!form.alignment) items.push("Set alignment so promo tone and match behavior stay consistent.");
    if (!form.archetype) items.push("Pick an archetype to guide your move choices.");
    if (form.traits.length < 3) items.push("Select exactly 3 personality traits.");
    if (!form.objective) items.push("Define how this character wins matches.");
    if (!ms.signature) items.push("Add a signature that naturally leads into your finisher.");
    if (!ms.finisher) items.push("Choose a protected finisher.");
    if (!form.finishLogic) items.push("Write the finish logic so your matches end with purpose.");
    return items.slice(0, 4);
  }, [form]);

  const tabs = [
    { key: "identity", label: "Identity" },
    { key: "objective", label: "Strategy" },
    { key: "moveset", label: "Move Set" },
    { key: "special", label: "Specials" },
    { key: "psychology", label: "Psychology" },
    { key: "expression", label: "Presentation" },
  ];

  return (
    <div className="min-h-screen text-white pb-20 md:pb-8" style={{ background: "radial-gradient(circle at top, #38104e 0%, #0a0a0f 40%, #050507 100%)" }}>
      {/* Save/Submit bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3" style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-sm text-zinc-400 hidden sm:block">{sheetId ? "Auto-saved" : "Unsaved draft"}</span>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => saveSheet(false)} disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition">
            Save Draft
          </button>
          <button onClick={() => saveSheet(true)} disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm text-white font-semibold transition"
            style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
            Submit for Review
          </button>
        </div>
      </div>

      {/* Mobile/Tablet: header + horizontal tab scroll */}
      <div className="md:hidden px-4 pt-4 pb-2 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="rounded-full bg-fuchsia-500/20 text-fuchsia-200 hover:bg-fuchsia-500/20">PCW Academy</Badge>
          </div>
          <h1 className="text-xl font-bold text-white">Create Your Wrestler</h1>
        </div>
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Profile Completion</span><span>{completion}%</span>
          </div>
          <Progress value={completion} className="h-1.5 bg-zinc-800" />
        </div>
        {/* Horizontal scrollable tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((item) => {
            const Icon = sectionIcons[item.key];
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition flex-shrink-0"
                style={active
                  ? { borderColor: "rgba(168,85,247,0.5)", background: "rgba(168,85,247,0.15)", color: "#fff" }
                  : { borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: two-column layout */}
      <div className="hidden md:grid mx-auto max-w-7xl gap-6 p-6" style={{ gridTemplateColumns: "300px 1fr" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className="rounded-full bg-fuchsia-500/20 text-fuchsia-200 hover:bg-fuchsia-500/20">PCW Academy</Badge>
                <Badge variant="outline" className="rounded-full border-zinc-700 text-zinc-300">Character Builder</Badge>
              </div>
              <CardTitle className="mt-3 text-2xl">Create Your Wrestler</CardTitle>
              <CardDescription className="text-zinc-400">
                Build a professional character system that connects identity, psychology, and move selection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span>Profile Completion</span>
                  <span>{completion}%</span>
                </div>
                <Progress value={completion} className="h-2 bg-zinc-800" />
              </div>

              <div className="space-y-2">
                {tabs.map((item) => {
                  const Icon = sectionIcons[item.key];
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        active ? "border-fuchsia-500/50 bg-fuchsia-500/15" : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${active ? "bg-fuchsia-500/20" : "bg-zinc-800"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    </button>
                  );
                })}
              </div>

              <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Coach Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-300">
                  {nextRecommendations.length ? (
                    nextRecommendations.map((item) => (
                      <div key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-fuchsia-300" />
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>Core character build is in a strong place. This is ready for coach review.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="hidden" />

            <TabsContent value="identity" className="m-0">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Identity</CardTitle>
                  <CardDescription className="text-zinc-400">Start with who this character is before choosing how they wrestle.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <Field label="Ring Name">
                    <Input value={form.ringName} onChange={(e) => update("ringName", e.target.value)} className="border-zinc-700 bg-zinc-900" />
                  </Field>
                  <Field label="Real Name / Legal Name">
                    <Input value={form.realName} onChange={(e) => update("realName", e.target.value)} className="border-zinc-700 bg-zinc-900" />
                  </Field>
                  <Field label="Alignment">
                    <Select value={form.alignment} onValueChange={(v) => update("alignment", v)}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose alignment" /></SelectTrigger>
                      <SelectContent>{alignments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Archetype">
                    <Select value={form.archetype} onValueChange={(v) => update("archetype", v)}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose archetype" /></SelectTrigger>
                      <SelectContent>{archetypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Hometown">
                    <Input value={form.hometown} onChange={(e) => update("hometown", e.target.value)} className="border-zinc-700 bg-zinc-900" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Billed Height">
                      <Input value={form.billedHeight} onChange={(e) => update("billedHeight", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder='6&apos;1"' />
                    </Field>
                    <Field label="Billed Weight">
                      <Input value={form.billedWeight} onChange={(e) => update("billedWeight", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder="225 lbs" />
                    </Field>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Field label="Personality Traits" hint="Pick 3">
                      <div className="flex flex-wrap gap-2">
                        {traits.map((trait) => (
                          <TogglePill key={trait} active={form.traits.includes(trait)} onClick={() => toggleTrait(trait)}>
                            {trait}
                          </TogglePill>
                        ))}
                      </div>
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objective" className="m-0">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Match Strategy</CardTitle>
                  <CardDescription className="text-zinc-400">Define how this character wins before building the move package.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Field label="Primary Match Objective">
                    <div className="flex flex-wrap gap-2">
                      {objectives.map((item) => (
                        <TogglePill key={item} active={form.objective === item} onClick={() => update("objective", item)}>{item}</TogglePill>
                      ))}
                    </div>
                  </Field>
                  <Field label="Strategy Notes" hint="Why this works for your character">
                    <Textarea value={form.objectiveNotes} onChange={(e) => update("objectiveNotes", e.target.value)} className="min-h-[160px] border-zinc-700 bg-zinc-900" />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moveset" className="m-0">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Move Set Builder</CardTitle>
                  <CardDescription className="text-zinc-400">Build a realistic move package by situation, not just by cool factor.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <Card className="rounded-2xl border-zinc-800 bg-zinc-900/70">
                    <CardHeader><CardTitle className="text-lg">Standing</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Light Strike"><Input value={form.moveSet.standingStrike} onChange={(e) => updateMove("standingStrike", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Heavy Strike"><Input value={form.moveSet.standingBigStrike} onChange={(e) => updateMove("standingBigStrike", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Hold / Control"><Input value={form.moveSet.standingHold} onChange={(e) => updateMove("standingHold", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Primary Move"><Input value={form.moveSet.standingMove} onChange={(e) => updateMove("standingMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-zinc-800 bg-zinc-900/70">
                    <CardHeader><CardTitle className="text-lg">Running</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Running Strike"><Input value={form.moveSet.runningStrike} onChange={(e) => updateMove("runningStrike", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Running Move"><Input value={form.moveSet.runningMove} onChange={(e) => updateMove("runningMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-zinc-800 bg-zinc-900/70">
                    <CardHeader><CardTitle className="text-lg">Ground</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Ground Strike"><Input value={form.moveSet.groundStrike} onChange={(e) => updateMove("groundStrike", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Running Ground Strike"><Input value={form.moveSet.runningGroundStrike} onChange={(e) => updateMove("runningGroundStrike", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Submission / Hold"><Input value={form.moveSet.groundHold} onChange={(e) => updateMove("groundHold", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Ground Control Move"><Input value={form.moveSet.groundMove} onChange={(e) => updateMove("groundMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-zinc-800 bg-zinc-900/70">
                    <CardHeader><CardTitle className="text-lg">Corner</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Corner Move"><Input value={form.moveSet.cornerMove} onChange={(e) => updateMove("cornerMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Downed Corner Move"><Input value={form.moveSet.downedCornerMove} onChange={(e) => updateMove("downedCornerMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Running Corner Move"><Input value={form.moveSet.runningCornerMove} onChange={(e) => updateMove("runningCornerMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-zinc-800 bg-zinc-900/70 lg:col-span-2">
                    <CardHeader><CardTitle className="text-lg">Ropes</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                      <Field label="Rope Move"><Input value={form.moveSet.ropeMove} onChange={(e) => updateMove("ropeMove", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Rebound (You)"><Input value={form.moveSet.ropeReboundYou} onChange={(e) => updateMove("ropeReboundYou", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                      <Field label="Rebound (Them)"><Input value={form.moveSet.ropeReboundThem} onChange={(e) => updateMove("ropeReboundThem", e.target.value)} className="border-zinc-700 bg-zinc-950" /></Field>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="special" className="m-0">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Specials</CardTitle>
                  <CardDescription className="text-zinc-400">This is the WWE CAS energy, but tied to match logic and character credibility.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <Field label="Comeback Move / Sequence"><Input value={form.moveSet.comeback} onChange={(e) => updateMove("comeback", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Emotion It Creates"><Input value={form.moveSet.comebackEmotion} onChange={(e) => updateMove("comebackEmotion", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder="Momentum, desperation, defiance..." /></Field>
                  <Field label="Signature"><Input value={form.moveSet.signature} onChange={(e) => updateMove("signature", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Signature Setup"><Input value={form.moveSet.signatureSetup} onChange={(e) => updateMove("signatureSetup", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder="Setup or out of nowhere?" /></Field>
                  <Field label="Finisher"><Input value={form.moveSet.finisher} onChange={(e) => updateMove("finisher", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Finisher Type">
                    <Select value={form.moveSet.finisherType} onValueChange={(v) => updateMove("finisherType", v)}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Impact">Impact</SelectItem>
                        <SelectItem value="Submission">Submission</SelectItem>
                        <SelectItem value="Flash">Flash</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Protected Finisher?">
                    <Select value={form.moveSet.finisherProtected} onValueChange={(v) => updateMove("finisherProtected", v)}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Yes or No" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="psychology" className="m-0">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Psychology</CardTitle>
                  <CardDescription className="text-zinc-400">This is where the trainee stops being a move collector and starts becoming a worker.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <Field label="Opening Strategy"><Textarea value={form.openingStrategy} onChange={(e) => update("openingStrategy", e.target.value)} className="min-h-[140px] border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Heat Segment Plan"><Textarea value={form.heatPlan} onChange={(e) => update("heatPlan", e.target.value)} className="min-h-[140px] border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Comeback Style"><Textarea value={form.comebackStyle} onChange={(e) => update("comebackStyle", e.target.value)} className="min-h-[140px] border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Finish Logic"><Textarea value={form.finishLogic} onChange={(e) => update("finishLogic", e.target.value)} className="min-h-[140px] border-zinc-700 bg-zinc-900" /></Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expression" className="m-0">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-950/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Presentation</CardTitle>
                  <CardDescription className="text-zinc-400">Character expression should be clear before the bell rings.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <Field label="Entrance Style">
                    <Select value={form.entranceStyle} onValueChange={(v) => update("entranceStyle", v)}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose entrance style" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Slow">Slow</SelectItem>
                        <SelectItem value="Explosive">Explosive</SelectItem>
                        <SelectItem value="Methodical">Methodical</SelectItem>
                        <SelectItem value="Cocky">Cocky</SelectItem>
                        <SelectItem value="Cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Crowd Interaction Style"><Input value={form.crowdInteraction} onChange={(e) => update("crowdInteraction", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                  <Field label="Signature Mannerisms"><Textarea value={form.mannerisms} onChange={(e) => update("mannerisms", e.target.value)} className="min-h-[130px] border-zinc-700 bg-zinc-900" /></Field>
                  <div className="space-y-4">
                    <Field label="Taunt 1"><Input value={form.taunt1} onChange={(e) => update("taunt1", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                    <Field label="Taunt 2"><Input value={form.taunt2} onChange={(e) => update("taunt2", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                    <Field label="Taunt 3"><Input value={form.taunt3} onChange={(e) => update("taunt3", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Mobile/Tablet: tab content (single column) */}
      <div className="md:hidden px-4 pb-4">
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="hidden" />

          <TabsContent value="identity" className="m-0">
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Identity</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">Start with who this character is before choosing how they wrestle.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Field label="Ring Name"><Input value={form.ringName} onChange={(e) => update("ringName", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Real Name / Legal Name"><Input value={form.realName} onChange={(e) => update("realName", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Alignment">
                  <Select value={form.alignment} onValueChange={(v) => update("alignment", v)}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose alignment" /></SelectTrigger>
                    <SelectContent>{alignments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Archetype">
                  <Select value={form.archetype} onValueChange={(v) => update("archetype", v)}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose archetype" /></SelectTrigger>
                    <SelectContent>{archetypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Hometown"><Input value={form.hometown} onChange={(e) => update("hometown", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Height"><Input value={form.billedHeight} onChange={(e) => update("billedHeight", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder='6&apos;1"' /></Field>
                  <Field label="Weight"><Input value={form.billedWeight} onChange={(e) => update("billedWeight", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder="225 lbs" /></Field>
                </div>
                <Field label="Personality Traits" hint="Pick 3">
                  <div className="flex flex-wrap gap-2">
                    {traits.map((trait) => (
                      <TogglePill key={trait} active={form.traits.includes(trait)} onClick={() => toggleTrait(trait)}>{trait}</TogglePill>
                    ))}
                  </div>
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objective" className="m-0">
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Match Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Primary Match Objective">
                  <div className="flex flex-wrap gap-2">
                    {objectives.map((item) => (
                      <TogglePill key={item} active={form.objective === item} onClick={() => update("objective", item)}>{item}</TogglePill>
                    ))}
                  </div>
                </Field>
                <Field label="Strategy Notes"><Textarea value={form.objectiveNotes} onChange={(e) => update("objectiveNotes", e.target.value)} className="min-h-[140px] border-zinc-700 bg-zinc-900" /></Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moveset" className="m-0 space-y-3">
            {[
              { title: "Standing", fields: [["Light Strike","standingStrike"],["Heavy Strike","standingBigStrike"],["Hold / Control","standingHold"],["Primary Move","standingMove"]] },
              { title: "Running", fields: [["Running Strike","runningStrike"],["Running Move","runningMove"]] },
              { title: "Ground", fields: [["Ground Strike","groundStrike"],["Running Ground Strike","runningGroundStrike"],["Submission / Hold","groundHold"],["Ground Control Move","groundMove"]] },
              { title: "Corner", fields: [["Corner Move","cornerMove"],["Downed Corner Move","downedCornerMove"],["Running Corner Move","runningCornerMove"]] },
              { title: "Ropes", fields: [["Rope Move","ropeMove"],["Rebound (You)","ropeReboundYou"],["Rebound (Them)","ropeReboundThem"]] },
            ].map(({ title, fields }) => (
              <Card key={title} className="rounded-2xl border-zinc-800 bg-zinc-950/80">
                <CardHeader className="pb-2"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {fields.map(([label, key]) => (
                    <Field key={key} label={label}><Input value={form.moveSet[key]} onChange={(e) => updateMove(key, e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="special" className="m-0">
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80">
              <CardHeader className="pb-3"><CardTitle className="text-xl">Specials</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Comeback Move"><Input value={form.moveSet.comeback} onChange={(e) => updateMove("comeback", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Emotion It Creates"><Input value={form.moveSet.comebackEmotion} onChange={(e) => updateMove("comebackEmotion", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder="Momentum, desperation, defiance..." /></Field>
                <Field label="Signature"><Input value={form.moveSet.signature} onChange={(e) => updateMove("signature", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Signature Setup"><Input value={form.moveSet.signatureSetup} onChange={(e) => updateMove("signatureSetup", e.target.value)} className="border-zinc-700 bg-zinc-900" placeholder="Setup or out of nowhere?" /></Field>
                <Field label="Finisher"><Input value={form.moveSet.finisher} onChange={(e) => updateMove("finisher", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Finisher Type">
                  <Select value={form.moveSet.finisherType} onValueChange={(v) => updateMove("finisherType", v)}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Impact">Impact</SelectItem>
                      <SelectItem value="Submission">Submission</SelectItem>
                      <SelectItem value="Flash">Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Protected Finisher?">
                  <Select value={form.moveSet.finisherProtected} onValueChange={(v) => updateMove("finisherProtected", v)}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Yes or No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="psychology" className="m-0">
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80">
              <CardHeader className="pb-3"><CardTitle className="text-xl">Psychology</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Opening Strategy"><Textarea value={form.openingStrategy} onChange={(e) => update("openingStrategy", e.target.value)} className="min-h-[120px] border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Heat Segment Plan"><Textarea value={form.heatPlan} onChange={(e) => update("heatPlan", e.target.value)} className="min-h-[120px] border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Comeback Style"><Textarea value={form.comebackStyle} onChange={(e) => update("comebackStyle", e.target.value)} className="min-h-[120px] border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Finish Logic"><Textarea value={form.finishLogic} onChange={(e) => update("finishLogic", e.target.value)} className="min-h-[120px] border-zinc-700 bg-zinc-900" /></Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expression" className="m-0">
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/80">
              <CardHeader className="pb-3"><CardTitle className="text-xl">Presentation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Entrance Style">
                  <Select value={form.entranceStyle} onValueChange={(v) => update("entranceStyle", v)}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-900"><SelectValue placeholder="Choose entrance style" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Slow">Slow</SelectItem>
                      <SelectItem value="Explosive">Explosive</SelectItem>
                      <SelectItem value="Methodical">Methodical</SelectItem>
                      <SelectItem value="Cocky">Cocky</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Crowd Interaction Style"><Input value={form.crowdInteraction} onChange={(e) => update("crowdInteraction", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Signature Mannerisms"><Textarea value={form.mannerisms} onChange={(e) => update("mannerisms", e.target.value)} className="min-h-[110px] border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Taunt 1"><Input value={form.taunt1} onChange={(e) => update("taunt1", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Taunt 2"><Input value={form.taunt2} onChange={(e) => update("taunt2", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
                <Field label="Taunt 3"><Input value={form.taunt3} onChange={(e) => update("taunt3", e.target.value)} className="border-zinc-700 bg-zinc-900" /></Field>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile Coach Notes */}
        {nextRecommendations.length > 0 && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-2">
            <p className="text-xs font-semibold text-fuchsia-300 uppercase tracking-wider">Coach Notes</p>
            {nextRecommendations.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-fuchsia-300 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}