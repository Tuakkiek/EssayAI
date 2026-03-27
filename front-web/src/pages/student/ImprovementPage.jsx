import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, TextQuote, WandSparkles } from "lucide-react";
import * as improvementApi from "@/api/improvement";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const TOOL_CONFIG = [
  {
    key: "rewrite",
    title: "Essay Rewrite",
    description: "Rewrite your essay to model a higher band response.",
    icon: <WandSparkles className="h-5 w-5" />,
  },
  {
    key: "vocabulary",
    title: "Vocabulary Boost",
    description: "Identify stronger word choices and replacements.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    key: "grammar",
    title: "Grammar Deep-Dive",
    description: "Understand grammar errors with rules and examples.",
    icon: <TextQuote className="h-5 w-5" />,
  },
];

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

function ImprovementPage() {
  usePageTitle("Improvement Tools");
  const [searchParams] = useSearchParams();
  const essayId = searchParams.get("essayId") || "";

  const [activeTool, setActiveTool] = useState("");
  const [loadingTool, setLoadingTool] = useState("");
  const [results, setResults] = useState({});
  const [openSections, setOpenSections] = useState({});

  const isDisabled = !essayId;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRunTool = async (toolKey) => {
    if (!essayId) {
      toast.error("Missing essayId in the URL.");
      return;
    }

    setActiveTool(toolKey);

    if (results[toolKey]) {
      return;
    }

    setLoadingTool(toolKey);

    try {
      let response;
      if (toolKey === "rewrite") {
        response = await improvementApi.rewriteEssay(essayId);
      } else if (toolKey === "vocabulary") {
        response = await improvementApi.enhanceVocabulary(essayId);
      } else {
        response = await improvementApi.explainGrammar(essayId);
      }

      const data = toData(response);
      setResults((prev) => ({ ...prev, [toolKey]: data }));
      setOpenSections((prev) => ({
        ...prev,
        [`${toolKey}-main`]: true,
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingTool("");
    }
  };

  const renderSection = useCallback(
    (sectionKey, title, content) => (
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="flex w-full items-center justify-between text-left"
        >
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <span className="text-xs text-gray-500">{openSections[sectionKey] ? "Hide" : "Show"}</span>
        </button>
        {openSections[sectionKey] ? <div className="mt-3 text-sm text-gray-700">{content}</div> : null}
      </div>
    ),
    [openSections],
  );

  const activeResult = results[activeTool];

  const rewriteSections = useMemo(() => {
    if (!activeResult) return null;

    return (
      <div className="space-y-3">
        {renderSection(
          "rewrite-main",
          "Rewritten Essay",
          <p className="whitespace-pre-wrap">{activeResult.rewrittenEssay || "-"}</p>,
        )}
        {renderSection(
          "rewrite-band",
          "Band Estimate",
          <p className="font-semibold text-primary">{activeResult.bandEstimate ?? "-"}</p>,
        )}
        {renderSection(
          "rewrite-key",
          "Key Improvements",
          <ul className="space-y-2">
            {(activeResult.keyImprovements || []).map((item) => (
              <li key={item} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {item}
              </li>
            ))}
          </ul>,
        )}
        {renderSection(
          "rewrite-changes",
          "Changes Explained",
          <div className="space-y-2">
            {(activeResult.changesExplained || []).map((change, index) => (
              <div key={`${change.original}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Type: {change.type}</p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-red-500">{change.original}</span> -&gt;{" "}
                  <span className="font-semibold text-green-600">{change.rewritten}</span>
                </p>
                <p className="text-xs text-gray-600">{change.reason}</p>
              </div>
            ))}
          </div>,
        )}
      </div>
    );
  }, [activeResult, renderSection]);

  const vocabSections = useMemo(() => {
    if (!activeResult) return null;

    return (
      <div className="space-y-3">
        {renderSection(
          "vocab-main",
          "Overall Feedback",
          <p className="whitespace-pre-wrap">{activeResult.overallFeedback || "-"}</p>,
        )}
        {renderSection(
          "vocab-band",
          "Vocabulary Band Estimate",
          <p className="font-semibold text-primary">{activeResult.vocabBandEstimate ?? "-"}</p>,
        )}
        {renderSection(
          "vocab-suggestions",
          "Suggestions",
          <div className="space-y-2">
            {(activeResult.suggestions || []).map((item, index) => (
              <div key={`${item.original}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-sm font-semibold text-gray-900">{item.original}</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {(item.alternatives || []).map((alt, altIndex) => (
                    <li key={`${alt.word}-${altIndex}`}>
                      {alt.word} - {alt.register} - {alt.context}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-600">{item.explanation}</p>
                <p className="text-xs font-semibold text-amber-600">{item.bandImpact}</p>
              </div>
            ))}
          </div>,
        )}
      </div>
    );
  }, [activeResult, renderSection]);

  const grammarSections = useMemo(() => {
    if (!activeResult) return null;

    return (
      <div className="space-y-3">
        {renderSection(
          "grammar-top",
          "Top Pattern",
          <p className="font-semibold text-gray-800">{activeResult.topPattern || "-"}</p>,
        )}
        {renderSection(
          "grammar-note",
          "Grammar Band Note",
          <p className="whitespace-pre-wrap">{activeResult.grammarBandNote || "-"}</p>,
        )}
        {renderSection(
          "grammar-explanations",
          "Explanations",
          <div className="space-y-2">
            {(activeResult.explanations || []).map((item, index) => (
              <div key={`${item.errorPhrase}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">{item.ruleName}</p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-red-500">{item.errorPhrase}</span> -&gt;{" "}
                  <span className="font-semibold text-green-600">{item.corrected}</span>
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.fullExplanation}</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {(item.examples || []).map((example, exampleIndex) => (
                    <li key={`${example.wrong}-${exampleIndex}`}>
                      Wrong: {example.wrong} | Right: {example.right}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs font-semibold text-amber-600">{item.tip}</p>
              </div>
            ))}
          </div>,
        )}
      </div>
    );
  }, [activeResult, renderSection]);

  const toolOutput = useMemo(() => {
    if (!activeTool || !activeResult) return null;
    if (activeTool === "rewrite") return rewriteSections;
    if (activeTool === "vocabulary") return vocabSections;
    return grammarSections;
  }, [activeTool, activeResult, rewriteSections, vocabSections, grammarSections]);

  return (
    <div className="space-y-6">
      <PageHeader title="Improvement Tools" subtitle="Pick a tool to level up your essay." />

      {isDisabled ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">Missing essayId</p>
          <p className="text-sm text-gray-600">Add ?essayId=YOUR_ID to the URL to use these tools.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {TOOL_CONFIG.map((tool) => {
          const isLoading = loadingTool === tool.key;
          const hasResult = Boolean(results[tool.key]);
          return (
            <Card key={tool.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primaryLight p-2 text-primaryDark">{tool.icon}</div>
                <p className="text-base font-bold text-gray-900">{tool.title}</p>
              </div>
              <p className="text-sm text-gray-600">{tool.description}</p>
              <Button
                onClick={() => handleRunTool(tool.key)}
                disabled={isDisabled || isLoading}
                loading={isLoading}
              >
                {hasResult ? "View result" : "Run tool"}
              </Button>
            </Card>
          );
        })}
      </div>

      {toolOutput ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Results</h2>
            <span className="text-xs font-semibold text-primary">{activeTool}</span>
          </div>
          {toolOutput}
        </Card>
      ) : (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">No results yet</p>
          <p className="text-sm text-gray-600">Choose a tool to generate improvement feedback.</p>
        </Card>
      )}
    </div>
  );
}

export default ImprovementPage;
