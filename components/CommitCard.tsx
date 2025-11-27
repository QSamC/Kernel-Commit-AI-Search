import React from 'react';
import { CommitAnalysis } from '../types';
import { GitCommit, User, Calendar, Star, Info, ExternalLink } from 'lucide-react';

interface CommitCardProps {
  commit: CommitAnalysis;
  rank: number;
}

const CommitCard: React.FC<CommitCardProps> = ({ commit, rank }) => {
  const scoreColor = commit.relevanceScore > 85 ? 'text-green-400' : commit.relevanceScore > 60 ? 'text-yellow-400' : 'text-gray-400';

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-lg p-5 mb-4 hover:border-terminal-highlight transition-colors group animate-fadeIn">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-terminal-border text-xs font-mono font-bold text-white">
            {rank}
          </span>
          <h3 className="text-lg font-semibold text-white group-hover:text-terminal-highlight line-clamp-1">
            {commit.subject}
          </h3>
        </div>
        <div className={`flex items-center gap-1 font-mono font-bold ${scoreColor} shrink-0`}>
          <Star size={14} fill="currentColor" />
          <span>{commit.relevanceScore}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 mb-4 font-mono">
        <div className="flex items-center gap-2">
          <GitCommit size={14} className="text-terminal-highlight" />
          <span className="truncate" title={commit.commitHash}>{commit.commitHash.substring(0, 12)}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={14} />
          <span className="truncate">{commit.author}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>{commit.date}</span>
        </div>
        {commit.url && (
           <div className="flex items-center gap-2">
             <a 
               href={commit.url} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-1 text-terminal-highlight hover:underline"
             >
               <ExternalLink size={14} />
               <span>View on GitHub</span>
             </a>
           </div>
        )}
      </div>

      <div className="bg-[#0f1218] rounded p-3 border-l-2 border-terminal-accent">
        <div className="flex items-center gap-2 text-terminal-accent mb-1 text-xs uppercase tracking-wider font-bold">
          <Info size={12} />
          AI Reasoning
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          {commit.reasoning}
        </p>
      </div>
    </div>
  );
};

export default CommitCard;
