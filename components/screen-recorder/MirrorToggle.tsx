import React from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MirrorToggleProps {
  isMirrored: boolean;
  onToggle: () => void;
}

export function MirrorToggle({ isMirrored, onToggle }: MirrorToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className={isMirrored ? "bg-blue-50 dark:bg-blue-900/20" : ""}
          >
            <FlipHorizontal
              className={`w-4 h-4 ${isMirrored ? "text-blue-500" : ""}`}
            />
            <span className="sr-only">Mirror Camera</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMirrored ? "Disable" : "Enable"} camera mirroring</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
