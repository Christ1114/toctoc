"use client";
import { orbitron } from '@/fonts/font';
import React from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Calendar, AlertTriangle, Info } from 'lucide-react';

const FirstModuleComponent = () => {
  const t = useTranslations("warning");

  const table = {
    titleHeader: t("table.titleHeader"),
    dateHeader: t("table.dateHeader"),
    title: t("table.title"),
    date: t("table.date"),
  };

  const content = {
    intro: t("content.intro"),
    modifiedDateLabel: t("content.modifiedDateLabel"),
    modifiedDate: t("content.modifiedDate"),
    detailsLabel: t("content.detailsLabel"),
    detailsText: t("content.detailsText"),
    articleTitle: t("content.articleTitle"),
    point1: t("content.point1"),
    point2: t("content.point2"),
    point3Label: t("content.point3Label"),
    point3Item1: t("content.point3Item1"),
    point3Item2: t("content.point3Item2"),
    point4: t("content.point4"),
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 h-full flex flex-col gap-y-4 sm:gap-y-6 lg:gap-y-8 items-center justify-center text-black dark:text-zinc-300 ${orbitron.className}`}
    >
     
      <div className="w-full overflow-x-auto rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-sm">
        <table
          className={`w-full min-w-70 sm:min-w-100 border-collapse text-xs sm:text-sm md:text-base ${orbitron.className}`}
        >
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{table.titleHeader}</span>
                </span>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{table.dateHeader}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-zinc-300 dark:border-zinc-700">
              <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">{table.title}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">{table.date}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-8 leading-relaxed w-full text-xs sm:text-sm md:text-base lg:text-lg">
        <div className="space-y-3 sm:space-y-4 lg:space-y-5">

          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-zinc-700 dark:text-zinc-300 wrap-break-words">
              {content.intro}
            </p>
          </div>

  
          <div className="flex items-start gap-2 flex-wrap">
            <strong className="shrink-0">{content.modifiedDateLabel}</strong>
            <span className="whitespace-nowrap">{content.modifiedDate}</span>
          </div>

         
          <div className="flex items-start gap-2 flex-wrap">
            <strong className="shrink-0">{content.detailsLabel}</strong>
            <span className="wrap-break-words">{content.detailsText}</span>
          </div>

          <h2 className="font-semibold text-sm sm:text-base md:text-lg lg:text-xl mt-4 sm:mt-6 lg:mt-8 border-l-4 border-yellow-500 pl-3 sm:pl-4">
            {content.articleTitle}
          </h2>

          
          <p className="text-zinc-700 dark:text-zinc-300 wrap-break-words">
            {content.point1}
          </p>

          <p className="text-zinc-700 dark:text-zinc-300 wrap-break-words">
            {content.point2}
          </p>

        
          <div className="space-y-2">
            <p className="font-medium wrap-break-words">{content.point3Label}</p>
            <ul className="list-disc pl-4 sm:pl-6 space-y-1.5 sm:space-y-2">
              <li className="wrap-break-words text-zinc-700 dark:text-zinc-300">{content.point3Item1}</li>
              <li className="wrap-break-words text-zinc-700 dark:text-zinc-300">{content.point3Item2}</li>
            </ul>
          </div>

         
          <p className="text-zinc-700 dark:text-zinc-300 wrap-break-words">
            {content.point4}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstModuleComponent;