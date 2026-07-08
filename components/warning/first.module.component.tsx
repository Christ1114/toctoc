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
      className={`w-full max-w-250 pt-15 pb-15 h-full flex flex-col gap-y-10 items-center justify-center text-black dark:text-zinc-300 ${orbitron.className}`}
    >
      <table
        border={1}
        cellPadding={10}
        cellSpacing={0}
        className={`w-full border-collapse ${orbitron.className}`}
      >
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th>{table.titleHeader}</th>
            <th>{table.dateHeader}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>{table.title}</strong></td>
            <td>{table.date}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-5 leading-relaxed">
        <p>{content.intro}</p>

        <p><strong>{content.modifiedDateLabel}</strong> {content.modifiedDate}</p>

        <p><strong>{content.detailsLabel}</strong> {content.detailsText}</p>

        <p><strong>{content.articleTitle}</strong></p>

        <p>{content.point1}</p>

        <p>{content.point2}</p>

        <p>{content.point3Label}</p>
        <ul className="list-disc pl-6">
          <li>{content.point3Item1}</li>
          <li>{content.point3Item2}</li>
        </ul>

        <p>{content.point4}</p>
      </div>
    </div>
  );
};

export default FirstModuleComponent;