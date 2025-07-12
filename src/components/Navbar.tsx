import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { SearchDialog } from '@/components/SearchDialog';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-sm font-bold text-white">SS</span>
              </div>
              <span className="hidden font-bold text-lg sm:inline-block">SkillSwap</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search skills or users..."
                  className="pl-10 pr-4"
                  onClick={() => setSearchOpen(true)}
                  readOnly
                />
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              <div className="p-4 space-y-4">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search skills or users..."
                    className="pl-10 pr-4"
                    onClick={() => {
                      setSearchOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    readOnly
                  />
                </div>

                {/* Mobile Menu Items */}
                {user ? (
                  <div className="space-y-2">
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="ghost" asChild className="w-full">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}