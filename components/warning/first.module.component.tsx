"use client";
import { orbitron } from '@/fonts/font';
import React from 'react';
import { useTranslations } from 'next-intl';

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
      className={`w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 h-full flex flex-col gap-y-6 sm:gap-y-8 lg:gap-y-10 items-center justify-center text-black dark:text-zinc-300 ${orbitron.className}`}
    >
    
      <div className="w-full overflow-x-auto">
        <table
          border={1}
          cellPadding={10}
          cellSpacing={0}
          className={`w-full min-w-75 border-collapse text-sm sm:text-base ${orbitron.className}`}
        >
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold">
                {table.titleHeader}
              </th> 
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold">
                {table.dateHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 sm:px-4 py-2 sm:py-3">
                <strong>{table.title}</strong>
              </td>
              <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                {table.date}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

     
      <div className="mt-5 sm:mt-8 leading-relaxed w-full text-sm sm:text-base lg:text-lg space-y-4 sm:space-y-5">
        <p className="wrap-break-words">{content.intro}</p>

        <p className="wrap-break-words">
          <strong>{content.modifiedDateLabel}</strong>{" "}
          <span className="whitespace-nowrap">{content.modifiedDate}</span>
        </p>

        <p className="wrap-break-words">
          <strong>{content.detailsLabel}</strong> {content.detailsText}
        </p>

        <p className="font-semibold text-base sm:text-lg lg:text-xl mt-6 sm:mt-8">
          {content.articleTitle}
        </p>

        <p className="wrap-break-words">{content.point1}</p>

        <p className="wrap-break-words">{content.point2}</p>

        <p className="wrap-break-words font-medium">{content.point3Label}</p>
        
        <ul className="list-disc pl-5 sm:pl-6 space-y-2">
          <li className="wrap-break-words">{content.point3Item1}</li>
          <li className="wrap-break-words">{content.point3Item2}</li>
        </ul>

        <p className="wrap-break-words">{content.point4}</p>
      </div>
    </div>
  );
};

export default FirstModuleComponent;