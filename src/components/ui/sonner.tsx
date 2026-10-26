import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      closeButton={!isMobile}
      swipeDirections={["top", "left", "right"]}
      dir="rtl"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast glass !rounded-3xl group-[.toaster]:text-foreground group-[.toaster]:border-white/40 group-[.toaster]:shadow-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "glass !border-white/40 !text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
