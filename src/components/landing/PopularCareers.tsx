import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { careers } from "@/data/careers";

const PopularCareers = () => {
  const picks = careers.slice(0, 6);

  return (
    <section className="py-16">
      <div className="container space-y-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Popular career guides</h2>
            <p className="text-muted-foreground text-sm mt-1">Salaries, required skills, and entry paths — free to read, no signup.</p>
          </div>
          <Link to="/careers" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
            All careers <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {picks.map((c) => (
            <Link
              key={c.slug}
              to={`/careers/${c.slug}`}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.shortDescription}</p>
              <p className="text-xs text-primary font-medium mt-3">{c.avgSalaryIN} in India</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCareers;
